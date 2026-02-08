import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { Routine, RoutineExercise, RoutineSet } from '@/payload-types'

// Replicate the interfaces from src/lib/api/routines.ts
interface FetchedRoutineSet {
  id: string
  type: 'N' | 'W' | 'D' | 'F'
  weight: string
  reps: string
  setOrder: number
}

interface FetchedExercise {
  id: string // RoutineExercise ID
  exerciseId: string // Actual Exercise ID
  name: string
  bodyPart?: string
  sets: FetchedRoutineSet[]
  order: number
}

interface FetchedRoutineDetails {
  id: string
  name: string
  description?: string
  exercises: FetchedExercise[]
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })

  try {
    // 1. Fetch the routine
    const routine = await payload.findByID({
      collection: 'routines',
      id,
    })

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    // 2. Fetch all routine exercises for this routine sorted by order
    const routineExercises = await payload.find({
      collection: 'routine-exercises',
      where: {
        routine: {
          equals: id,
        },
      },
      sort: 'exerciseOrder',
      limit: 100,
      depth: 1, // To get exercise details
    })

    // 3. Fetch ALL sets for ALL exercises in this routine at once
    // We can't easily do a "where routineExercise IN [...]" with Payload's find cleanly if the list is huge,
    // but for a routine with < 20 exercises, it's fine.
    // Alternatively, we can fetch all sets where routineExercise.routine = id if we can navigate that deep?
    // Payload relationship querying usually supports nested?
    // Let's try to fetch sets where routineExercise is in the list of IDs we just got.

    const routineExerciseIds = routineExercises.docs.map((re) => re.id)

    let allSets: RoutineSet[] = []

    if (routineExerciseIds.length > 0) {
      // Fetch sets for these exercises
      // Optimized: Fetch all sets for these exercises in one go
      const setsResponse = await payload.find({
        collection: 'routine-sets',
        where: {
          routineExercise: {
            in: routineExerciseIds,
          },
        },
        limit: 500, // Should be enough for a full routine
        sort: 'setOrder',
      })
      allSets = setsResponse.docs as RoutineSet[]
    }

    // 4. In-memory aggregation
    const exercises: FetchedExercise[] = routineExercises.docs.map((re) => {
      const reId = String(re.id)

      // Filter sets for this specific routine exercise
      const relatedSets = allSets
        .filter((set) => {
          const setReId =
            typeof set.routineExercise === 'object' ? set.routineExercise.id : set.routineExercise
          return String(setReId) === reId
        })
        .sort((a, b) => a.setOrder - b.setOrder)

      // Map sets to UI format
      const formattedSets: FetchedRoutineSet[] = relatedSets.map((set) => ({
        id: String(set.id),
        type:
          set.setLabel === 'warmup'
            ? 'W'
            : set.setLabel === 'drop'
              ? 'D'
              : set.setLabel === 'failure'
                ? 'F'
                : 'N',
        weight: String(set.weight),
        reps: String(set.reps),
        setOrder: set.setOrder,
      }))

      // Get exercise details
      const exercise = typeof re.exercise === 'object' ? re.exercise : null
      const muscleGroup =
        exercise && typeof exercise.muscleGroup === 'object' ? exercise.muscleGroup : null

      return {
        id: reId,
        exerciseId: typeof re.exercise === 'object' ? String(re.exercise.id) : String(re.exercise),
        name: exercise?.name || 'Unknown Exercise',
        bodyPart: muscleGroup?.name || undefined,
        sets: formattedSets,
        order: re.exerciseOrder,
      }
    })

    const result: FetchedRoutineDetails = {
      id: String(routine.id),
      name: routine.name,
      description: routine.notes || undefined,
      exercises,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching routine details:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
