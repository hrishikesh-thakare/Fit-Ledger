import apiFetch from './client'
import type { WorkoutSet } from '@/payload-types'

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

    // Use the optimized server-side endpoint
    const response = await apiFetch<ActiveWorkoutData>('/custom/workouts/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routineId,
        date,
      }),
    })

    return response
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
