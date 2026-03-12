import apiFetch from './client'
import { offlineDb } from '@/lib/offline/db'

/**
 * Load workout data from a routine (read-only, no DB writes).
 * Tries API first, falls back to cached routine data from IndexedDB.
 */
interface LoadWorkoutParams {
  routineId: string
  userId?: string
}

export interface WorkoutSetData {
  id?: string
  type: 'N' | 'W' | 'D'
  weight: string
  reps: string
  completed: boolean
  previous?: string
  setOrder: number
  setLabel?: string
}

export interface WorkoutExerciseData {
  id: string // Temp client-side ID
  exerciseId: string // Actual Exercise ID
  name: string
  equipment?: string
  restTime: number
  sets: WorkoutSetData[]
  order: number
}

export interface LoadedWorkoutData {
  title: string
  date: string
  exercises: WorkoutExerciseData[]
}

export const loadWorkoutFromRoutine = async (
  params: LoadWorkoutParams,
): Promise<LoadedWorkoutData> => {
  const { routineId, userId } = params

  // Try API first
  try {
    const queryParams = new URLSearchParams({ routineId })
    if (userId) queryParams.set('userId', userId)

    const response = await apiFetch<LoadedWorkoutData>(
      `/custom/workouts/load?${queryParams.toString()}`,
      { cache: 'no-store' },
    )
    return response
  } catch (error) {
    console.warn('[Workout] API load failed, attempting offline fallback:', error)
  }

  // Fallback: build workout template from cached routine in IndexedDB
  const cachedRoutine = await offlineDb.routines.get(routineId)
  if (!cachedRoutine) {
    throw new Error('Cannot load workout — routine not available offline')
  }

  return {
    title: cachedRoutine.name,
    date: new Date().toISOString(),
    exercises: cachedRoutine.exercises.map((re, i) => ({
      id: crypto.randomUUID(),
      exerciseId: re.exerciseId,
      name: re.exerciseName,
      restTime: 90, // Default rest time
      sets: re.sets.length > 0
        ? re.sets.map((s, j) => ({
          id: crypto.randomUUID(),
          type: (s.type === 'W' ? 'W' : s.type === 'D' ? 'D' : 'N') as 'N' | 'W' | 'D',
          weight: s.weight || '',
          reps: s.reps || '',
          completed: false,
          previous: '-',
          setOrder: j,
        }))
        : [
          {
            id: crypto.randomUUID(),
            type: 'N' as const,
            weight: '',
            reps: '',
            completed: false,
            previous: '-',
            setOrder: 0,
          },
        ],
      order: re.order ?? i,
    })),
  }
}

/**
 * Update a workout set (online-only, for post-save editing)
 */
export const updateWorkoutSet = async (setId: string, data: { weight?: number; reps?: number }) => {
  try {
    await apiFetch(`/workout-sets/${setId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error updating workout set:', error)
    throw error
  }
}

/**
 * Complete a workout (online-only, for post-save editing)
 */
export const completeWorkout = async (workoutDayId: string, durationSeconds: number) => {
  try {
    await apiFetch(`/workout-days/${workoutDayId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        durationSeconds,
      }),
    })
  } catch (error) {
    console.error('Error completing workout:', error)
    throw error
  }
}

/**
 * Add a set to a workout exercise (online-only, for post-save editing)
 */
export const addWorkoutSet = async (
  workoutDayId: string,
  workoutExerciseId: string,
  setOrder: number,
  templateSet?: { weight: number; reps: number; setLabel: string },
) => {
  try {
    const response = await apiFetch<{
      doc: {
        id: number
        weight: number
        reps: number
        setOrder: number
        previousWeight?: number
        previousReps?: number
      }
    }>('/workout-sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutDay: Number(workoutDayId),
        workoutExercise: Number(workoutExerciseId),
        setOrder,
        setLabel: templateSet?.setLabel || 'working',
        reps: templateSet?.reps || 0,
        weight: templateSet?.weight || 0,
      }),
    })

    return {
      id: String(response.doc.id),
      type:
        templateSet?.setLabel === 'warmup'
          ? 'W'
          : templateSet?.setLabel === 'drop'
            ? 'D'
            : ('N' as const),
      weight: String(templateSet?.weight || 0),
      reps: String(templateSet?.reps || 0),
      completed: false,
      previous: response.doc.previousWeight
        ? `${response.doc.previousWeight}x${response.doc.previousReps}`
        : '-',
      setOrder,
    }
  } catch (error) {
    console.error('Error adding workout set:', error)
    throw error
  }
}

/**
 * Delete a workout set (online-only, for post-save editing)
 */
export const deleteWorkoutSet = async (setId: string) => {
  try {
    await apiFetch(`/workout-sets/${setId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Error deleting workout set:', error)
    throw error
  }
}
