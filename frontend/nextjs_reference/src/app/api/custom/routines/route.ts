import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { formatServerTimingHeader } from '@/lib/timing'

export const dynamic = 'force-dynamic' // Required because of searchParams

export async function GET(req: NextRequest) {
  const routeStart = performance.now()

  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ errors: [{ message: 'User ID is required' }] }, { status: 400 })
    }

    const numericUserId = Number(userId)
    if (Number.isNaN(numericUserId)) {
      return NextResponse.json({ errors: [{ message: 'Invalid User ID' }] }, { status: 400 })
    }

    const payload = await getPayloadClient()

    // ------------------------------------------------
    // 1️⃣ Fetch routines (cheap, depth 0)
    // ------------------------------------------------
    const routinesRes = await payload.find({
      collection: 'routines',
      where: {
        user: { equals: numericUserId },
        isActive: { equals: 'active' },
      },
      sort: '-createdAt',
      depth: 0,
      limit: 100,
      select: {
        id: true,
        name: true,
        notes: true,
        exerciseCount: true,
        setCount: true,
      },
    })

    const routines = routinesRes.docs
    const routineIds = routines.map((r) => r.id)

    if (routineIds.length === 0) {
      return NextResponse.json({ docs: [] })
    }

    // ------------------------------------------------
    // 2️⃣ Fetch routine-exercises (depth 0 only)
    // ------------------------------------------------
    const routineExercisesRes = await payload.find({
      collection: 'routine-exercises',
      where: {
        routine: { in: routineIds },
      },
      depth: 0,
      limit: 500,
      select: {
        routine: true,
        exercise: true,
        exerciseOrder: true,
      },
      sort: 'exerciseOrder',
    })

    const routineExercises = routineExercisesRes.docs

    // ------------------------------------------------
    // 3️⃣ Collect unique exercise IDs
    // ------------------------------------------------
    const exerciseIds = [
      ...new Set(
        routineExercises.map((rx) =>
          typeof rx.exercise === 'object' ? rx.exercise.id : rx.exercise,
        ),
      ),
    ]

    // ------------------------------------------------
    // 4️⃣ Fetch exercises separately (controlled depth)
    // ------------------------------------------------
    const exercisesRes =
      exerciseIds.length > 0
        ? await payload.find({
          collection: 'exercises',
          where: {
            id: { in: exerciseIds },
          },
          depth: 1, // only to get muscleGroup
          limit: 500,
          select: {
            id: true,
            name: true,
            muscleGroup: true,
          },
        })
        : { docs: [] }

    const exercises = exercisesRes.docs

    // Map exerciseId → exercise
    const exerciseMap = new Map<number, { id: number; name: string; muscleGroup?: { name: string } | number }>()
    exercises.forEach((ex) => {
      exerciseMap.set(ex.id, ex)
    })

    // ------------------------------------------------
    // 5️⃣ Group exercises by routine
    // ------------------------------------------------
    const exercisesByRoutine: Record<number, typeof routineExercises[number][]> = {}

    routineExercises.forEach((rx) => {
      const routineId = typeof rx.routine === 'object' ? rx.routine.id : rx.routine

      if (!exercisesByRoutine[routineId]) {
        exercisesByRoutine[routineId] = []
      }

      exercisesByRoutine[routineId].push(rx)
    })

    // ------------------------------------------------
    // 6️⃣ Helper: Duration
    // ------------------------------------------------
    const formatDuration = (totalSets: number): string => {
      if (!totalSets) return '~0m'

      const minutes = Math.round(totalSets * 3)

      if (minutes >= 60) {
        const hrs = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs}h`
      }

      return `~${minutes}m`
    }

    // ------------------------------------------------
    // 7️⃣ Construct final result
    // ------------------------------------------------
    const results = routines.map((routine) => {
      const rxList = exercisesByRoutine[routine.id] || []

      const muscleGroups = new Set<string>()
      const previewExercises: string[] = []

      rxList.forEach((rx) => {
        const exerciseId = typeof rx.exercise === 'object' ? rx.exercise.id : rx.exercise

        const exercise = exerciseMap.get(exerciseId)
        if (!exercise) return

        if (previewExercises.length < 3) {
          previewExercises.push(exercise.name)
        }

        if (exercise.muscleGroup && typeof exercise.muscleGroup === 'object') {
          muscleGroups.add(exercise.muscleGroup.name)
        }
      })

      return {
        id: routine.id,
        name: routine.name,
        description: routine.notes || '',
        exerciseCount: routine.exerciseCount || 0,
        duration: formatDuration(routine.setCount || 0),
        previewExercises,
        muscleGroups: Array.from(muscleGroups),
      }
    })

    const totalDuration = performance.now() - routeStart

    return NextResponse.json(
      { docs: results },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
          'Server-Timing': formatServerTimingHeader({
            total: totalDuration,
          }),
        },
      },
    )
  } catch (error: unknown) {
    const errObj = error instanceof Error ? error : new Error('Internal Server Error')
    return NextResponse.json(
      {
        errors: [
          {
            message: errObj.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? errObj.stack : undefined,
          },
        ],
      },
      { status: 500 },
    )
  }
}
