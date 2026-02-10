import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/custom/workouts/start
 *
 * Now repurposed as the SAVE endpoint.
 * Called when the user finishes a workout. Creates all DB records at once.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      routineId,
      date = new Date().toISOString(),
      durationSeconds = 0,
      exercises, // Array of { exerciseId, name, sets: [{ weight, reps, setLabel, completed }] }
    } = await req.json()

    if (!routineId || !exercises) {
      return NextResponse.json({ error: 'routineId and exercises are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Fetch routine to get user ID
    const routine = await payload.findByID({
      collection: 'routines',
      id: Number(routineId),
      depth: 0,
    })

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    const userId = typeof routine.user === 'object' ? routine.user.id : routine.user

    // 1. Create workout day
    const workoutDay = await payload.create({
      collection: 'workout-days',
      data: {
        user: userId,
        title: routine.name,
        date,
        durationSeconds,
      },
    })

    // 2. Create all workout exercises in parallel
    const workoutExercises = await Promise.all(
      exercises.map((ex: any, i: number) =>
        payload.create({
          collection: 'workout-exercises',
          data: {
            workoutDay: workoutDay.id,
            exercise: Number(ex.exerciseId),
            exerciseOrder: i,
          },
        }),
      ),
    )

    // 3. Create all workout sets in one parallel batch
    const allSetPromises: Promise<any>[] = []

    exercises.forEach((ex: any, exIndex: number) => {
      const workoutExercise = workoutExercises[exIndex]
      ;(ex.sets || []).forEach((set: any, setIndex: number) => {
        allSetPromises.push(
          payload.create({
            collection: 'workout-sets',
            data: {
              workoutDay: workoutDay.id,
              workoutExercise: workoutExercise.id,
              setOrder: setIndex,
              setLabel: set.setLabel || 'working',
              reps: Number(set.reps) || 0,
              weight: Number(set.weight) || 0,
            },
          }),
        )
      })
    })

    await Promise.all(allSetPromises)

    return NextResponse.json({
      workoutDayId: String(workoutDay.id),
      saved: true,
    })
  } catch (error) {
    console.error('Error saving workout:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
