import type { Payload } from 'payload'

interface FetchedRoutineSet {
  id: string
  type: 'N' | 'W' | 'D'
  weight: string
  reps: string
  setOrder: number
}

interface FetchedExercise {
  id: string
  exerciseId: string
  name: string
  bodyPart?: string
  equipment?: string
  sets: FetchedRoutineSet[]
  order: number
}

interface FetchedRoutineDetails {
  id: string
  name: string
  description?: string
  exercises: FetchedExercise[]
}

export async function getRoutineDetailsFromPayload(
  payload: Payload,
  id: string | number,
): Promise<{ status: number; body: FetchedRoutineDetails | { error: string }; headers?: Record<string, string> }> {
  const numericId = Number(id)

  const routine = await payload.findByID({
    collection: 'routines',
    id: numericId,
  })

  if (!routine) {
    return { status: 404, body: { error: 'Routine not found' } }
  }

  const routineExercises = await payload.find({
    collection: 'routine-exercises',
    where: {
      routine: {
        equals: numericId,
      },
    },
    sort: 'exerciseOrder',
    limit: 100,
    depth: 1,
  })

  const routineExerciseIds = routineExercises.docs.map((re) => re.id)
  let allSets: Array<{ routineExercise?: string | number | { id: string | number }; id: string | number; setLabel: string; weight: number; reps: number; setOrder: number }> = []

  if (routineExerciseIds.length > 0) {
    const setsResponse = await payload.find({
      collection: 'routine-sets',
      where: {
        routineExercise: {
          in: routineExerciseIds,
        },
      },
      limit: 500,
      sort: 'setOrder',
    })
    allSets = setsResponse.docs as typeof allSets
  }

  const exercises: FetchedExercise[] = routineExercises.docs.map((re) => {
    const reId = String(re.id)
    const exId = typeof re.exercise === 'object' ? String(re.exercise.id) : String(re.exercise)

    const relatedSets = allSets
      .filter((set) => {
        const setReId = typeof set.routineExercise === 'object' ? set.routineExercise.id : set.routineExercise
        return String(setReId) === reId
      })
      .sort((a, b) => a.setOrder - b.setOrder)

    const formattedSets: FetchedRoutineSet[] = relatedSets.map((set) => ({
      id: String(set.id),
      type: set.setLabel === 'warmup' ? 'W' : set.setLabel === 'drop' ? 'D' : 'N',
      weight: String(set.weight),
      reps: String(set.reps),
      setOrder: set.setOrder,
    }))

    const EQUIPMENT_LABELS: Record<string, string> = {
      barbell: 'Barbell',
      dumbbell: 'Dumbbell',
      machine: 'Machine',
      cable: 'Cable',
      smith_machine: 'Smith Machine',
      bodyweight: 'Bodyweight',
    }

    const exercise = typeof re.exercise === 'object' ? re.exercise : null
    const muscleGroup = exercise && typeof exercise.muscleGroup === 'object' ? exercise.muscleGroup : null

    return {
      id: reId,
      exerciseId: exId,
      name: exercise?.name || 'Unknown Exercise',
      bodyPart: muscleGroup?.name || undefined,
      equipment: exercise?.equipment && typeof exercise.equipment === 'string' ? (EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment) : undefined,
      sets: formattedSets,
      order: re.exerciseOrder,
    }
  })

  return {
    status: 200,
    body: {
      id: String(routine.id),
      name: routine.name,
      description: routine.notes || undefined,
      exercises,
    },
  }
}
