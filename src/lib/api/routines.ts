import apiFetch from './client'
import type { Routine, RoutineExercise, RoutineSet, Exercise } from '@/payload-types'

interface RoutineSetData {
  id?: string
  type: 'N' | 'W' | 'D' | 'F'
  weight: string
  reps: string
  // internal temporary id for UI tracking, not sent to backend if new
}

interface ExerciseData {
  id?: string // This is the RoutineExercise ID if it exists, or random string if new
  exerciseId: string // The actual Exercise ID (from availableExercises)
  sets: RoutineSetData[]
  order: number
}

interface SaveRoutineParams {
  id?: string // Routine ID if editing, 'new' or undefined if creating
  name: string
  description?: string
  exercises: ExerciseData[]
}

export const saveRoutine = async (data: SaveRoutineParams) => {
  try {
    let routineId = data.id && data.id !== 'new' ? data.id : null
    let routineResponse

    // 1. Create or Update Routine
    if (routineId) {
      routineResponse = await apiFetch(`/routines/${routineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
        }),
      })
    } else {
      routineResponse = await apiFetch('/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          user: undefined, // Payload infers user from auth context usually
        }),
      })
      routineId = routineResponse.doc.id
    }

    if (!routineId) throw new Error('Failed to save routine')

    // Convert routineId to number for consistency
    const numericRoutineId = Number(routineId)

    // 2. Handle Routine Exercises
    // We need to fetch existing routine exercises to know what to delete
    // OR we can rely on the UI state if we trust it fully, but safe to fetch.
    // For V1, let's process the input list.

    // We will track IDs of RoutineExercises and Sets that we touched, to delete the rest?
    // "Delete the rest" is complex.
    // Simplified V1 approach:
    // - Iterate over input exercises.
    // - If ID exists and is valid (not temp), update.
    // - If ID is temp, create.
    // - Note: We need to map the UI's notion of "Exercise ID" (which is actually RoutineExercise ID in the list) correctly.

    // UI State `exercises` array items have `id`.
    // If we loaded from backend, `id` is valid `RoutineExercise` ID.
    // If added newly, `id` is random string.

    const processedRoutineExerciseIds: string[] = []

    for (let i = 0; i < data.exercises.length; i++) {
      const ex = data.exercises[i]
      const isNew = !ex.id || ex.id.length < 10 // Simple check for temp ID (usually random string < 24 chars of objectId?)
      // Valid ObjectID is 24 hex chars. Math.random is shorter usually.
      // Better: check if it exists in DB or track "isNew" flag.
      // Usage of random string in UI might overlap with short IDs? Unlikely.
      // Let's assume non-ObjectId-looking strings are new.

      let routineExerciseId = ex.id

      const payload = {
        routine: numericRoutineId,
        exercise: Number(ex.exerciseId),
        exerciseOrder: i,
      }

      console.log('Saving routine exercise:', payload, 'isNew:', isNew)

      if (isNew || ex.id?.includes('.')) {
        // . includes math.random usually
        // Create
        const res = await apiFetch('/routine-exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        routineExerciseId = res.doc.id
      } else {
        // Update
        await apiFetch(`/routine-exercises/${ex.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        routineExerciseId = ex.id
      }

      if (routineExerciseId) processedRoutineExerciseIds.push(routineExerciseId)

      // 3. Handle Sets for this RoutineExercise
      if (routineExerciseId) {
        const processedSetIds: string[] = []
        for (let j = 0; j < ex.sets.length; j++) {
          const set = ex.sets[j]
          const isSetNew = !set.id || set.id.includes('.') || set.id.length < 10

          const setPayload = {
            routineExercise: Number(routineExerciseId),
            setOrder: j,
            setLabel:
              set.type === 'W'
                ? 'warmup'
                : set.type === 'D'
                  ? 'drop'
                  : set.type === 'F'
                    ? 'failure'
                    : 'working',
            reps: Number(set.reps) || 0,
            weight: Number(set.weight) || 0,
          }

          if (isSetNew) {
            const res = await apiFetch('/routine-sets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(setPayload),
            })
            processedSetIds.push(res.doc.id)
          } else {
            await apiFetch(`/routine-sets/${set.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(setPayload),
            })
            processedSetIds.push(set.id!)
          }
        }

        // Delete orphaned sets for this RoutineExercise
        // We need to fetch existing sets for this RE to know what to delete
        // This is getting expensive (N+1 queries).
        // Optimization: We could rely on frontend to tell us what to delete?
        // Or just fetch all sets for the routine at start?
        // For V1, let's just fetch sets for this specific RoutineExercise to be safe.
        const existingSets = await apiFetch(
          `/routine-sets?where[routineExercise][equals]=${routineExerciseId}&limit=300`,
        )
        const existingSetIds = existingSets.docs.map((d: any) => d.id)
        const setsToDelete = existingSetIds.filter((id: string) => !processedSetIds.includes(id))

        for (const id of setsToDelete) {
          await apiFetch(`/routine-sets/${id}`, { method: 'DELETE' })
        }
      }
    }

    // Delete orphaned Routine Exercises
    // Fetch all REs for this routine
    const existingREs = await apiFetch(
      `/routine-exercises?where[routine][equals]=${numericRoutineId}&limit=100`,
    )
    const existingREIds = existingREs.docs.map((d: any) => d.id)
    const resToDelete = existingREIds.filter(
      (id: string) => !processedRoutineExerciseIds.includes(id),
    )

    for (const id of resToDelete) {
      // We should also delete sets associated with these REs?
      // PayloadCMS might cascade delete if configured, standard MongoDB doesn't.
      // Let's safe delete sets first.
      const setsOfRe = await apiFetch(
        `/routine-sets?where[routineExercise][equals]=${id}&limit=300`,
      )
      for (const set of setsOfRe.docs) {
        await apiFetch(`/routine-sets/${set.id}`, { method: 'DELETE' })
      }
      await apiFetch(`/routine-exercises/${id}`, { method: 'DELETE' })
    }

    // Return the ID for navigation
    return routineId
  } catch (error) {
    console.error('Error saving routine:', error)
    throw error
  }
}

/**
 * Fetch a routine with all its exercises and sets
 */
export interface FetchedRoutineSet {
  id: string
  type: 'N' | 'W' | 'D' | 'F'
  weight: string
  reps: string
  setOrder: number
}

export interface FetchedExercise {
  id: string // RoutineExercise ID
  exerciseId: string // Actual Exercise ID
  name: string
  bodyPart?: string
  sets: FetchedRoutineSet[]
  order: number
}

export interface FetchedRoutineDetails {
  id: string
  name: string
  description?: string
  exercises: FetchedExercise[]
}

export const fetchRoutineDetails = async (routineId: string): Promise<FetchedRoutineDetails> => {
  try {
    return await apiFetch<FetchedRoutineDetails>(`/custom/routines/${routineId}`)
  } catch (error) {
    console.error('Error fetching routine details:', error)
    throw error
  }
}

/**
 * Fetch all available exercises for the exercise picker
 */
export interface AvailableExercise {
  id: string
  name: string
  bodyPart: string
}

export const fetchExercises = async (): Promise<AvailableExercise[]> => {
  try {
    const response = await apiFetch<{ docs: Exercise[] }>('/exercises?depth=1&limit=1000&sort=name')

    return response.docs.map((exercise) => {
      const muscleGroup = typeof exercise.muscleGroup === 'object' ? exercise.muscleGroup : null
      return {
        id: String(exercise.id),
        name: exercise.name,
        bodyPart: muscleGroup?.name || 'Other',
      }
    })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    throw error
  }
}
