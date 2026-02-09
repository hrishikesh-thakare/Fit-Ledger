import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { RoutineSet } from '@/payload-types'

export async function POST(req: NextRequest) {
  try {
    const { routineId, date = new Date().toISOString() } = await req.json()

    if (!routineId) {
      return NextResponse.json({ error: 'routineId is required' }, { status: 400 })
    }

    // Cast routineId to number for DB operations
    const numericRoutineId = Number(routineId)

    const payload = await getPayload({ config })

    // 1. Fetch routine details
    const routine = await payload.findByID({
      collection: 'routines',
      id: numericRoutineId,
    })

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    // 2. Fetch routine exercises with sets (optimized: depth 1 to get exercise details)
    const routineExercisesResponse = await payload.find({
      collection: 'routine-exercises',
      where: {
        routine: {
          equals: numericRoutineId,
        },
      },
      sort: 'exerciseOrder',
      limit: 100,
      depth: 1,
    })

    const routineExerciseIds = routineExercisesResponse.docs.map((re) => re.id)

    // Fetch all routine-sets for these exercises in one go
    let allRoutineSets: RoutineSet[] = []
    if (routineExerciseIds.length > 0) {
      const routineSetsResponse = await payload.find({
        collection: 'routine-sets',
        where: {
          routineExercise: {
            in: routineExerciseIds,
          },
        },
        limit: 1000,
        sort: 'setOrder',
      })
      allRoutineSets = routineSetsResponse.docs as RoutineSet[]
    }

    // 3. Create workout day
    const workoutDay = await payload.create({
      collection: 'workout-days',
      data: {
        user: typeof routine.user === 'object' ? routine.user.id : routine.user,
        title: routine.name,
        date,
        durationSeconds: 0,
      },
    })

    // 3.5. Batch Fetch Previous Stats for ALL exercises
    // To solve N+1, we find the latest workout set for each exercise
    // It's tricky with Payload's query API to do "latest per group".
    // Strategy: Fetch last 500 sets for these exercises sorted by date desc,
    // and in-memory pick the first one for each exercise.
    // Ideally we'd filter by user too.
    const exerciseIds = routineExercisesResponse.docs.map((re) =>
      typeof re.exercise === 'object' ? re.exercise.id : re.exercise,
    )

    const relevantExerciseIds = exerciseIds.filter(
      (id) => typeof id === 'number' || typeof id === 'string',
    )

    const previousStatsMap = new Map<string, { weight: number; reps: number }>()

    if (relevantExerciseIds.length > 0) {
      // Fetch recent sets for these exercises
      // We need to filter by user to be correct
      const userId = typeof routine.user === 'object' ? routine.user.id : routine.user

      const recentSets = await payload.find({
        collection: 'workout-sets',
        where: {
          and: [
            {
              'workoutExercise.exercise': { in: relevantExerciseIds },
            },
            {
              'workoutExercise.workoutDay.user': { equals: userId },
            },
            {
              // Ensure we don't pick up future sets if date is backdated (unlikely but safe)
              'workoutExercise.workoutDay.date': { less_than: date },
            },
          ],
        },
        sort: '-createdAt',
        limit: 500, // Should be enough to cover recent history for all exercises
        depth: 1, // need workoutExercise.exercise to map back
      })

      // In-memory grouping to find latest per exercise
      for (const set of recentSets.docs) {
        const exId =
          typeof set.workoutExercise === 'object' &&
          typeof set.workoutExercise.exercise === 'object'
            ? String(set.workoutExercise.exercise.id)
            : typeof set.workoutExercise === 'object'
              ? String(set.workoutExercise.exercise)
              : null

        if (exId && !previousStatsMap.has(exId)) {
          previousStatsMap.set(exId, {
            weight: set.weight,
            reps: set.reps,
          })
        }
      }
    }

    const workoutDayId = String(workoutDay.id)

    // 4. Create workout exercises and sets
    const exercisePromises = routineExercisesResponse.docs.map(async (re, i) => {
      const exerciseId = typeof re.exercise === 'object' ? re.exercise.id : re.exercise
      const exerciseIdString = String(exerciseId)

      // Create workout exercise
      const workoutExercise = await payload.create({
        collection: 'workout-exercises',
        data: {
          workoutDay: workoutDay.id,
          exercise: exerciseId,
          exerciseOrder: i,
        },
      })

      // Filter sets for this routine exercise
      const relatedSets = allRoutineSets
        .filter((set) => {
          const setReId =
            typeof set.routineExercise === 'object' ? set.routineExercise.id : set.routineExercise
          return String(setReId) === String(re.id)
        })
        .sort((a, b) => a.setOrder - b.setOrder)

      // Get previous stats for this exercise
      const prevStats = previousStatsMap.get(exerciseIdString)

      // Create sets for this exercise
      const setPromises = relatedSets.map((routineSet, j) => {
        return payload.create({
          collection: 'workout-sets',
          data: {
            workoutDay: workoutDay.id,
            workoutExercise: workoutExercise.id,
            setOrder: j,
            setLabel: routineSet.setLabel,
            reps: routineSet.reps,
            weight: routineSet.weight,
            // Pass previous stats explicitly to bypass hook lookup
            previousWeight: prevStats ? prevStats.weight : null,
            previousReps: prevStats ? prevStats.reps : null,
          },
        })
      })

      const createdSets = await Promise.all(setPromises)

      // Map to response format expected by frontend
      const setsData = createdSets.map((ws) => ({
        id: String(ws.id),
        type:
          ws.setLabel === 'warmup'
            ? 'W'
            : ws.setLabel === 'drop'
              ? 'D'
              : ws.setLabel === 'failure'
                ? 'F'
                : 'N',
        weight: String(ws.weight),
        reps: String(ws.reps),
        completed: false,
        previous: ws.previousWeight ? `${ws.previousWeight}x${ws.previousReps}` : '-',
        setOrder: ws.setOrder,
      }))

      return {
        id: String(workoutExercise.id),
        exerciseId: String(exerciseId),
        name: typeof re.exercise === 'object' ? re.exercise.name : 'Unknown Exercise',
        restTime: 60,
        sets: setsData,
        order: i,
      }
    })

    const exercises = await Promise.all(exercisePromises)
    // Sort by order to ensure response is correct
    exercises.sort((a, b) => a.order - b.order)

    const result = {
      workoutDayId,
      title: routine.name,
      date,
      exercises,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error starting workout:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
