import apiFetch from './client'
import type { WorkoutDay, WorkoutExercise, WorkoutSet, Exercise } from '@/payload-types'

/**
 * Start a workout from a routine
 */
interface StartWorkoutFromRoutineParams {
  routineId: string
  date?: string
}

export interface WorkoutSetData {
  id?: string
  type: 'N' | 'W' | 'D' | 'F'
  weight: string
  reps: string
  completed: boolean
  previous?: string
  setOrder: number
}

export interface WorkoutExerciseData {
  id: string // WorkoutExercise ID
  exerciseId: string // Actual Exercise ID
  name: string
  restTime: number
  sets: WorkoutSetData[]
  order: number
}

export interface ActiveWorkoutData {
  workoutDayId: string
  title: string
  date: string
  exercises: WorkoutExerciseData[]
}

export const startWorkoutFromRoutine = async (
  params: StartWorkoutFromRoutineParams,
): Promise<ActiveWorkoutData> => {
  try {
    const { routineId, date = new Date().toISOString() } = params

    // 1. Fetch routine details
    const routine = await apiFetch(`/routines/${routineId}`)

    // 2. Fetch routine exercises with sets
    const routineExercisesResponse = await apiFetch<{ docs: any[] }>(
      `/routine-exercises?where[routine][equals]=${routineId}&depth=1&sort=exerciseOrder&limit=100`,
    )

    // 3. Create workout day
    const workoutDay = await apiFetch<{ doc: WorkoutDay }>('/workout-days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: routine.name,
        date,
        durationSeconds: 0,
      }),
    })

    const workoutDayId = String(workoutDay.doc.id)

    // 4. Create workout exercises and sets
    const exercises: WorkoutExerciseData[] = []

    for (let i = 0; i < routineExercisesResponse.docs.length; i++) {
      const re = routineExercisesResponse.docs[i]
      const exercise = typeof re.exercise === 'object' ? re.exercise : null

      // Create workout exercise
      const workoutExerciseResponse = await apiFetch<{ doc: WorkoutExercise }>(
        '/workout-exercises',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workoutDay: Number(workoutDayId),
            exercise:
              typeof re.exercise === 'object' ? Number(re.exercise.id) : Number(re.exercise),
            exerciseOrder: i,
          }),
        },
      )

      const workoutExerciseId = String(workoutExerciseResponse.doc.id)

      // Fetch routine sets for this exercise
      const routineSetsResponse = await apiFetch<{ docs: any[] }>(
        `/routine-sets?where[routineExercise][equals]=${re.id}&sort=setOrder&limit=100`,
      )

      // Create workout sets
      const sets: WorkoutSetData[] = []

      for (let j = 0; j < routineSetsResponse.docs.length; j++) {
        const routineSet = routineSetsResponse.docs[j]

        const workoutSetResponse = await apiFetch<{ doc: WorkoutSet }>('/workout-sets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workoutDay: Number(workoutDayId),
            workoutExercise: Number(workoutExerciseId),
            setOrder: j,
            setLabel: routineSet.setLabel,
            reps: routineSet.reps,
            weight: routineSet.weight,
          }),
        })

        sets.push({
          id: String(workoutSetResponse.doc.id),
          type:
            routineSet.setLabel === 'warmup'
              ? 'W'
              : routineSet.setLabel === 'drop'
                ? 'D'
                : routineSet.setLabel === 'failure'
                  ? 'F'
                  : 'N',
          weight: String(routineSet.weight),
          reps: String(routineSet.reps),
          completed: false,
          previous: workoutSetResponse.doc.previousWeight
            ? `${workoutSetResponse.doc.previousWeight}x${workoutSetResponse.doc.previousReps}`
            : '-',
          setOrder: j,
        })
      }

      exercises.push({
        id: workoutExerciseId,
        exerciseId: typeof re.exercise === 'object' ? String(re.exercise.id) : String(re.exercise),
        name: exercise?.name || 'Unknown Exercise',
        restTime: 60, // Default rest time
        sets,
        order: i,
      })
    }

    return {
      workoutDayId,
      title: routine.name,
      date,
      exercises,
    }
  } catch (error) {
    console.error('Error starting workout from routine:', error)
    throw error
  }
}

/**
 * Update a workout set
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
 * Complete a workout
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
 * Add a set to a workout exercise
 */
export const addWorkoutSet = async (
  workoutDayId: string,
  workoutExerciseId: string,
  setOrder: number,
  templateSet?: { weight: number; reps: number; setLabel: string },
) => {
  try {
    const response = await apiFetch<{ doc: WorkoutSet }>('/workout-sets', {
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
            : templateSet?.setLabel === 'failure'
              ? 'F'
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
 * Delete a workout set
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
