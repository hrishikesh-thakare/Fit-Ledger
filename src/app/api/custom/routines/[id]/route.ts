import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { RoutineSet } from '@/payload-types'

export const dynamic = 'force-dynamic'

// Replicate the interfaces from src/lib/api/routines.ts
interface FetchedRoutineSet {
  id: string
  type: 'N' | 'W' | 'D'
  weight: string
  reps: string
  setOrder: number
}

interface FetchedExercise {
  id: string // RoutineExercise ID
  exerciseId: string // Actual Exercise ID
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

import { formatServerTimingHeader } from '@/lib/timing'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const routeStart = performance.now()
  const { id } = await params
  const payload = await getPayloadClient()

  // Cast ID to number
  const numericId = Number(id)

  try {
    const payloadStart = performance.now()
    // 1. Fetch the routine
    const routine = await payload.findByID({
      collection: 'routines',
      id: numericId,
    })

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    // 2. Fetch all routine exercises for this routine sorted by order
    const routineExercises = await payload.find({
      collection: 'routine-exercises',
      where: {
        routine: {
          equals: numericId,
        },
      },
      sort: 'exerciseOrder',
      limit: 100,
      depth: 1, // To get exercise details
    })

    // 3. Fetch ALL sets for ALL exercises in this routine at once
    const routineExerciseIds = routineExercises.docs.map((re) => re.id)

    let allSets: RoutineSet[] = []

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
      allSets = setsResponse.docs as RoutineSet[]
    }
    const payloadDuration = performance.now() - payloadStart

    // 4. In-memory aggregation
    const exercises: FetchedExercise[] = routineExercises.docs.map((re) => {
      const reId = String(re.id)
      const exId = typeof re.exercise === 'object' ? String(re.exercise.id) : String(re.exercise)

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
        exerciseId: exId,
        name: exercise?.name || 'Unknown Exercise',
        bodyPart: muscleGroup?.name || undefined,
        equipment: exercise?.equipment || undefined,
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

    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/routines/${id}`)
    console.log(`Payload duration: ${payloadDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`)

    return NextResponse.json(result, {
      headers: {
        // Short cache for routine details - 10s cache, revalidate in background for 1 min
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
        'Server-Timing': formatServerTimingHeader({
          total: totalDuration,
          payload: payloadDuration,
        }),
      },
    })
  } catch (error) {
    console.error('Error fetching routine details:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
