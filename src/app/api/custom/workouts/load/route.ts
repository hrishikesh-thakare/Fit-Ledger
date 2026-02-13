import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { RoutineSet } from '@/payload-types'

/**
 * GET /api/custom/workouts/load?routineId=X&userId=Y
 *
 * Read-only endpoint: fetches routine data + previous stats
 * for rendering the workout page. Zero database writes.
 */
import { formatServerTimingHeader } from '@/lib/timing'

export async function GET(req: NextRequest) {
  const routeStart = performance.now()
  try {
    const routineId = req.nextUrl.searchParams.get('routineId')
    const userId = req.nextUrl.searchParams.get('userId')
    const date = new Date().toISOString()

    if (!routineId) {
      return NextResponse.json({ error: 'routineId is required' }, { status: 400 })
    }

    const numericRoutineId = Number(routineId)
    const payload = await getPayloadClient()

    const payloadStart = performance.now()
    // 1. Parallel fetch: routine + routine-exercises
    const [routine, routineExercisesResponse] = await Promise.all([
      payload.findByID({
        collection: 'routines',
        id: numericRoutineId,
      }),
      payload.find({
        collection: 'routine-exercises',
        where: {
          routine: { equals: numericRoutineId },
        },
        sort: 'exerciseOrder',
        limit: 100,
        depth: 1,
      }),
    ])

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    const routineExerciseIds = routineExercisesResponse.docs.map((re) => re.id)
    const resolvedUserId = userId
      ? Number(userId)
      : typeof routine.user === 'object'
        ? routine.user.id
        : routine.user

    const exerciseIds = routineExercisesResponse.docs
      .map((re) => (typeof re.exercise === 'object' ? re.exercise.id : re.exercise))
      .filter((id) => typeof id === 'number' || typeof id === 'string')

    // 2. Parallel fetch: routine-sets + previous stats (no writes!)
    const [routineSetsResponse, previousStatsMap] = await Promise.all([
      routineExerciseIds.length > 0
        ? payload.find({
            collection: 'routine-sets',
            where: {
              routineExercise: { in: routineExerciseIds },
            },
            limit: 1000,
            sort: 'setOrder',
            depth: 0,
          })
        : Promise.resolve({ docs: [] as RoutineSet[] }),

      // Fetch previous stats: Parallel queries for accuracy
      Promise.all(
        exerciseIds.map(async (exId) => {
          const sets = await payload.find({
            collection: 'workout-sets',
            where: {
              and: [
                { 'workoutExercise.exercise': { equals: exId } },
                { 'workoutExercise.workoutDay.user': { equals: resolvedUserId } },
                { 'workoutExercise.workoutDay.date': { less_than: date } },
              ],
            },
            sort: '-createdAt',
            limit: 1,
            depth: 0, // We only need weight/reps, no joins
          })
          return { exId: String(exId), set: sets.docs[0] }
        }),
      ).then((results) => {
        const statsMap = new Map<string, { weight: number; reps: number }>()
        results.forEach(({ exId, set }) => {
          if (set) {
            statsMap.set(exId, { weight: set.weight, reps: set.reps })
          }
        })
        return statsMap
      }),
    ])

    const payloadDuration = performance.now() - payloadStart

    const allRoutineSets = routineSetsResponse.docs as RoutineSet[]

    // 3. Build response (no DB writes, just data assembly)
    const exercises = routineExercisesResponse.docs.map((re, i) => {
      const exerciseId = typeof re.exercise === 'object' ? re.exercise.id : re.exercise
      const exerciseIdString = String(exerciseId)

      const relatedSets = allRoutineSets
        .filter((set) => {
          const setReId =
            typeof set.routineExercise === 'object' ? set.routineExercise.id : set.routineExercise
          return String(setReId) === String(re.id)
        })
        .sort((a, b) => a.setOrder - b.setOrder)

      const prevStats = previousStatsMap.get(exerciseIdString)

      const setsData = relatedSets.map((routineSet, j) => ({
        id: `temp-${i}-${j}`, // Temporary client-side ID
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
        previous: prevStats ? `${prevStats.weight}x${prevStats.reps}` : '-',
        setOrder: j,
        setLabel: routineSet.setLabel,
      }))

      return {
        id: `temp-ex-${i}`,
        exerciseId: String(exerciseId),
        name: typeof re.exercise === 'object' ? re.exercise.name : 'Unknown Exercise',
        restTime: 60,
        sets: setsData,
        order: i,
      }
    })

    exercises.sort((a, b) => a.order - b.order)

    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/workouts/load`)
    console.log(`Payload duration: ${payloadDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`)

    return NextResponse.json(
      {
        title: routine.name,
        date,
        exercises,
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
    console.error('Error loading workout data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
