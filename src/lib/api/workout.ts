import apiFetch from './client'
import { syncManager } from '@/lib/offline/sync-manager'

/**
 * Load workout data from a routine (read-only, no DB writes)
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
  try {
    const { routineId, userId } = params
    const queryParams = new URLSearchParams({ routineId })
    if (userId) queryParams.set('userId', userId)

    const response = await apiFetch<LoadedWorkoutData>(
      `/custom/workouts/load?${queryParams.toString()}`,
      { cache: 'no-store' },
    )
    return response
  } catch (error) {
    console.error('Error loading workout data:', error)
    throw error
  }
}

/**
 * Save workout (called when user finishes workout)
 * Creates all DB records: workout-day, workout-exercises, workout-sets
 */
interface SaveWorkoutParams {
  routineId: string
  date: string
  durationSeconds: number
  exercises: Array<{
    exerciseId: string
    name: string
    sets: Array<{
      weight: string
      reps: string
      setLabel: string
      completed: boolean
    }>
  }>
}

export const saveWorkout = async (params: SaveWorkoutParams): Promise<{ workoutDayId: string }> => {
  // ── Offline path: save locally, queue for sync later ──────────
  if (!navigator.onLine) {
    const offlineId = crypto.randomUUID()
    await syncManager.saveWorkoutOffline({
      id: offlineId,
      routineId: params.routineId,
      date: params.date,
      durationSeconds: params.durationSeconds,
      exercises: params.exercises,
      createdAt: new Date().toISOString(),
    })
    console.log('[Workout] Saved offline, will sync when online:', offlineId)
    return { workoutDayId: offlineId }
  }

  // ── Online path: try server, fallback to IndexedDB on network error ──
  try {
    const response = await apiFetch<{ workoutDayId: string; saved: boolean }>(
      '/custom/workouts/start',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    )
    return { workoutDayId: response.workoutDayId }
  } catch (error) {
    // Network error (Failed to fetch, ERR_INTERNET_DISCONNECTED, etc.) → save offline
    const isNetworkError =
      error instanceof TypeError &&
      (error.message.includes('fetch') || error.message.includes('network'))

    if (isNetworkError) {
      const offlineId = crypto.randomUUID()
      await syncManager.saveWorkoutOffline({
        id: offlineId,
        routineId: params.routineId,
        date: params.date,
        durationSeconds: params.durationSeconds,
        exercises: params.exercises,
        createdAt: new Date().toISOString(),
      })
      console.log('[Workout] Network error — saved offline, will sync when online:', offlineId)
      return { workoutDayId: offlineId }
    }

    // Server error (4xx/5xx) — re-throw so BackgroundSyncContext can retry
    console.error('Error saving workout:', error)
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
    const response = await apiFetch<{ doc: { id: number; weight: number; reps: number; setOrder: number; previousWeight?: number; previousReps?: number } }>('/workout-sets', {
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
