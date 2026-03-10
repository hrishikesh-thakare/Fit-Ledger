import apiFetch from './client'

interface RoutineSetData {
  id?: string
  type: 'N' | 'W' | 'D'
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
    const routineId = data.id && data.id !== 'new' ? data.id : 'new'

    // The save endpoint handles both create (id='new') and update
    const result = await apiFetch<{ success: boolean; id: string | number }>(
      `/custom/routines/${routineId}/save`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          exercises: data.exercises,
        }),
      },
    )

    return String(result.id)
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
  type: 'N' | 'W' | 'D'
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
  equipment?: string
}

export async function fetchExercises(): Promise<AvailableExercise[]> {
  const response = await apiFetch<{ docs: AvailableExercise[] }>('/custom/exercises')
  return response.docs
}
