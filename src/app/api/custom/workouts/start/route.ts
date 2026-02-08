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

    const payload = await getPayload({ config })

    // 1. Fetch routine details
    const routine = await payload.findByID({
      collection: 'routines',
      id: routineId,
    })

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    // 2. Fetch routine exercises with sets (optimized: depth 1 to get exercise details)
    const routineExercisesResponse = await payload.find({
      collection: 'routine-exercises',
      where: {
        routine: {
          equals: routineId,
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

    const workoutDayId = String(workoutDay.id)

    // 4. Create workout exercises and sets
    // Optimization: Parallelize creation of exercises?
    // Payload `create` is atomic per call.
    // For absolute data integrity, sequential is safer, but parallel is faster.
    // Given < 20 exercises, sequential is fine on server side (still ms).
    // Let's stick to sequential for reliability of order, or use Promise.all.
    // Order matters for `exerciseOrder`.

    // We can use Promise.all for exercises if we assign order correctly.
    const exercisePromises = routineExercisesResponse.docs.map(async (re, i) => {
      const exerciseId = typeof re.exercise === 'object' ? re.exercise.id : re.exercise

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

      // Create sets for this exercise
      // We can do this in parallel too
      const setPromises = relatedSets.map((routineSet, j) => {
        // Note: The 'beforeChange' hook in WorkoutSets handles 'previousWeight/reps' auto-fill
        // if we rely on it. However, hooks add overhead.
        // If performance is critical, we might want to calculate previous here?
        // But re-implementing hook logic is risky. Let's rely on the hook for now.
        // It runs on server, so it's fast (no HTTP rtt).
        return payload.create({
          collection: 'workout-sets',
          data: {
            workoutDay: workoutDay.id,
            workoutExercise: workoutExercise.id,
            setOrder: j,
            setLabel: routineSet.setLabel,
            reps: routineSet.reps,
            weight: routineSet.weight,
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
