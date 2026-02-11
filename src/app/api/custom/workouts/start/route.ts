import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

interface WorkoutSetData {
  weight: string | number
  reps: string | number
  setLabel?: string
  completed?: boolean
}

interface WorkoutExerciseData {
  exerciseId: string | number
  name?: string
  sets: WorkoutSetData[]
}

interface SaveWorkoutRequest {
  routineId: string | number
  date?: string
  durationSeconds?: number
  exercises: WorkoutExerciseData[]
}

/**
 * POST /api/custom/workouts/start
 *
 * Save endpoint for workouts.
 * Uses a database transaction to ensure data integrity.
 */
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  // Start transaction
  // transactions may return null if the database adapter doesn't support them
  // or if they are not enabled.
  const t = await payload.db.beginTransaction()

  try {
    const body: SaveWorkoutRequest = await req.json()
    const { routineId, date = new Date().toISOString(), durationSeconds = 0, exercises } = body

    if (!routineId || !exercises) {
      if (t) await payload.db.rollbackTransaction(t)
      return NextResponse.json({ error: 'routineId and exercises are required' }, { status: 400 })
    }

    // Fetch routine to get user ID
    const routine = await payload.findByID({
      collection: 'routines',
      id: Number(routineId),
      depth: 0,
      req: t ? { transactionID: t } : undefined, // Pass transaction context only if it exists
    })

    if (!routine) {
      if (t) await payload.db.rollbackTransaction(t)
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
      req: t ? { transactionID: t } : undefined,
    })

    // 2. Create all workout exercises in parallel
    const workoutExercises = await Promise.all(
      exercises.map((ex, i) =>
        payload.create({
          collection: 'workout-exercises',
          data: {
            workoutDay: workoutDay.id,
            exercise: Number(ex.exerciseId),
            exerciseOrder: i,
          },
          req: t ? { transactionID: t } : undefined,
        }),
      ),
    )

    // 3. Create all workout sets in one parallel batch
    const allSetPromises: Promise<any>[] = []
    const validSetLabels = ['warmup', 'working', 'drop', 'failure']

    exercises.forEach((ex, exIndex) => {
      const workoutExercise = workoutExercises[exIndex]
      ;(ex.sets || []).forEach((set, setIndex) => {
        let setLabel: 'warmup' | 'working' | 'drop' | 'failure' = 'working'
        if (set.setLabel && validSetLabels.includes(set.setLabel)) {
          setLabel = set.setLabel as 'warmup' | 'working' | 'drop' | 'failure'
        }

        allSetPromises.push(
          payload.create({
            collection: 'workout-sets',
            data: {
              workoutDay: workoutDay.id,
              workoutExercise: workoutExercise.id,
              setOrder: setIndex,
              setLabel: setLabel,
              reps: Number(set.reps) || 0,
              weight: Number(set.weight) || 0,
            },
            req: t ? { transactionID: t } : undefined,
          }),
        )
      })
    })

    await Promise.all(allSetPromises)

    // Commit transaction
    if (t) await payload.db.commitTransaction(t)

    return NextResponse.json({
      workoutDayId: String(workoutDay.id),
      saved: true,
    })
  } catch (error) {
    console.error('Error saving workout:', error)
    // Rollback transaction on error
    if (t) await payload.db.rollbackTransaction(t)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
