import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { RoutineSet } from '@/payload-types'

/**
 * GET /api/custom/workouts/load?routineId=X&userId=Y
 *
 * Read-only endpoint: fetches routine data + previous stats
 * for rendering the workout page. Zero database writes.
 */
export async function GET(req: NextRequest) {
  try {
    const routineId = req.nextUrl.searchParams.get('routineId')
    const userId = req.nextUrl.searchParams.get('userId')
    const date = new Date().toISOString()

    if (!routineId) {
      return NextResponse.json({ error: 'routineId is required' }, { status: 400 })
    }

    const numericRoutineId = Number(routineId)
    const payload = await getPayload({ config })

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

      // Fetch previous stats
      exerciseIds.length > 0
        ? payload
            .find({
              collection: 'workout-sets',
              where: {
                and: [
                  { 'workoutExercise.exercise': { in: exerciseIds } },
                  { 'workoutExercise.workoutDay.user': { equals: resolvedUserId } },
                  { 'workoutExercise.workoutDay.date': { less_than: date } },
                ],
              },
              sort: '-createdAt',
              limit: 500,
              depth: 1,
            })
            .then((recentSets) => {
              const statsMap = new Map<string, { weight: number; reps: number }>()
              for (const set of recentSets.docs) {
                const exId =
                  typeof set.workoutExercise === 'object' &&
                  typeof set.workoutExercise.exercise === 'object'
                    ? String(set.workoutExercise.exercise.id)
                    : typeof set.workoutExercise === 'object'
                      ? String(set.workoutExercise.exercise)
                      : null

                if (exId && !statsMap.has(exId)) {
                  statsMap.set(exId, { weight: set.weight, reps: set.reps })
                }
              }
              return statsMap
            })
        : Promise.resolve(new Map<string, { weight: number; reps: number }>()),
    ])

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

    return NextResponse.json({
      title: routine.name,
      date,
      exercises,
    })
  } catch (error) {
    console.error('Error loading workout data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
