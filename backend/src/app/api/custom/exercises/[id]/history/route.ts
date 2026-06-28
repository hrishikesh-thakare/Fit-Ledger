import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { formatServerTimingHeader } from '@/lib/timing'
import type { WorkoutSet } from '@/payload-types'

export const revalidate = 0

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const routeStart = performance.now()
  const { id } = await params
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  const payload = await getPayloadClient()

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'admin' && String(user.id) !== String(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const payloadStart = performance.now()

    // -----------------------------
    // 1️⃣ Resolve Exercise
    // -----------------------------
    let exercise
    const numericId = Number(id)

    if (!isNaN(numericId)) {
      exercise = await payload.findByID({
        collection: 'exercises',
        id: numericId,
        depth: 1,
      })
    } else {
      const nameQuery = id.replace(/-/g, ' ')
      const exercises = await payload.find({
        collection: 'exercises',
        where: {
          name: { like: nameQuery },
        },
        limit: 1,
        depth: 1,
      })
      exercise = exercises.docs[0]
    }

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    // -----------------------------
    // 2️⃣ Fetch WorkoutExercises
    // -----------------------------
    const workoutExercisesRes = await payload.find({
      collection: 'workout-exercises',
      where: {
        and: [{ exercise: { equals: exercise.id } }, { 'workoutDay.user': { equals: userId } }],
      },
      limit: 500,
      sort: '-createdAt',
      depth: 0,
    })

    const workoutExercises = workoutExercisesRes.docs

    if (workoutExercises.length === 0) {
      return NextResponse.json({
        exercise: {
          id: exercise.id,
          name: exercise.name,
          muscleGroup: 'Unknown',
          personalBest: null,
        },
        history: [],
      })
    }

    const workoutExerciseIds = workoutExercises.map((we) => we.id)
    const workoutDayIds = workoutExercises.map((we) => we.workoutDay)

    // -----------------------------
    // 3️⃣ Fetch WorkoutDays (bulk)
    // -----------------------------
    const workoutDaysRes = await payload.find({
      collection: 'workout-days',
      where: {
        id: { in: workoutDayIds },
      },
      depth: 0,
      limit: 0,
    })

    const workoutDayMap = new Map(workoutDaysRes.docs.map((wd) => [wd.id, wd]))

    // -----------------------------
    // 4️⃣ Fetch Sets (bulk)
    // -----------------------------
    const setsRes = await payload.find({
      collection: 'workout-sets',
      where: {
        workoutExercise: { in: workoutExerciseIds },
      },
      limit: 0,
      depth: 0,
    })

    // Group sets by workoutExercise ID
    const setsByWorkoutExercise = new Map<number, WorkoutSet[]>()

    for (const s of setsRes.docs) {
      const key = typeof s.workoutExercise === 'object' ? s.workoutExercise.id : s.workoutExercise

      if (!setsByWorkoutExercise.has(key)) {
        setsByWorkoutExercise.set(key, [])
      }

      setsByWorkoutExercise.get(key)!.push(s)
    }

    const payloadDuration = performance.now() - payloadStart

    // -----------------------------
    // 5️⃣ Process History
    // -----------------------------
    let personalBest = { weight: 0, reps: 0, date: '' }

    const history = workoutExercises
      .map((we) => {
        const weSets = setsByWorkoutExercise.get(we.id) || []
        const workoutDayId = typeof we.workoutDay === 'object' ? we.workoutDay.id : we.workoutDay

        const workoutDay = workoutDayMap.get(workoutDayId)

        if (!workoutDay) return null

        const volume = weSets.reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0)

        const bestSet = weSets.reduce(
          (best, current) => ((current.weight || 0) > (best.weight || 0) ? current : best),
          { weight: 0, reps: 0 },
        )

        if (bestSet.weight > personalBest.weight) {
          personalBest = {
            weight: bestSet.weight,
            reps: bestSet.reps,
            date: workoutDay.date,
          }
        }

        return {
          date: workoutDay.date,
          weight: bestSet.weight,
          reps: bestSet.reps,
          volume,
          sets: weSets.length,
          isPR: false,
        }
      })
      .filter(Boolean)

    if (personalBest.weight > 0) {
      const prEntry = history.find(e => e?.date === personalBest.date)
      if (prEntry) prEntry.isPR = true
    }

    const totalDuration = performance.now() - routeStart

    return NextResponse.json(
      {
        exercise: {
          id: exercise.id,
          name: exercise.name,
          muscleGroup: typeof exercise.muscleGroup === 'object' && exercise.muscleGroup !== null ? exercise.muscleGroup.name : 'Unknown',
          personalBest: personalBest.weight > 0 ? personalBest : null,
        },
        history,
      },
      {
        headers: {
          'Server-Timing': formatServerTimingHeader({
            total: totalDuration,
            payload: payloadDuration,
          }),
        },
      },
    )
  } catch (error) {
    console.error('Error fetching exercise history:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
