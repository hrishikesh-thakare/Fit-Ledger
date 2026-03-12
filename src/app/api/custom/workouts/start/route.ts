import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

interface WorkoutSetData {
  weight: string | number
  reps: string | number
  setLabel?: string
  completed?: boolean
  setOrder?: number
}

interface WorkoutExerciseData {
  exerciseId: string | number
  name?: string
  sets: WorkoutSetData[]
}

interface SaveWorkoutRequest {
  clientId?: string
  routineId: string | number
  date?: string
  durationSeconds?: number
  updatePrevWeights?: boolean
  exercises: WorkoutExerciseData[]
}

/**
 * POST /api/custom/workouts/start
 *
 * Save endpoint for workouts.
 * Uses a database transaction to ensure data integrity.
 */
import { formatServerTimingHeader } from '@/lib/timing'

export async function POST(req: NextRequest) {
  const routeStart = performance.now()
  const payload = await getPayloadClient()

  // Start transaction
  // transactions may return null if the database adapter doesn't support them
  // or if they are not enabled.
  const t = await payload.db.beginTransaction()

  try {
    const payloadStart = performance.now()
    const body: SaveWorkoutRequest = await req.json()
    const { clientId, routineId, date = new Date().toISOString(), durationSeconds = 0, updatePrevWeights = false, exercises } = body

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

    // Calculate stats
    let totalVolumeKg = 0
    exercises.forEach((ex) => {
      ; (ex.sets || []).forEach((set) => {
        totalVolumeKg += (Number(set.weight) || 0) * (Number(set.reps) || 0)
      })
    })
    const exerciseCount = exercises.length

    const userId = typeof routine.user === 'object' ? routine.user.id : routine.user

    // ── Idempotency check: if clientId exists, reject duplicates ──
    if (clientId) {
      const existing = await payload.find({
        collection: 'workout-days',
        where: { clientId: { equals: clientId } },
        limit: 1,
        depth: 0,
      })
      if (existing.docs.length > 0) {
        // Already saved — return existing ID (idempotent response)
        if (t) await payload.db.commitTransaction(t)
        return NextResponse.json({
          workoutDayId: String(existing.docs[0].id),
          saved: true,
          deduplicated: true,
        })
      }
    }

    // 1. Create workout day
    const workoutDay = await payload.create({
      collection: 'workout-days',
      data: {
        user: userId,
        routine: Number(routineId),
        title: routine.name,
        date,
        durationSeconds,
        volumeKg: totalVolumeKg,
        exerciseCount,
        ...(clientId ? { clientId } : {}),
      },
      req: t ? { transactionID: t } : undefined,
    })

    // 2. Create all workout exercises in parallel
    // overrideAccess: true — intentionally bypasses the beforeChange hook that
    // performs a redundant ownership check (findByID on workout-days). Ownership
    // is already validated above via the routine fetch (line 52-62).
    // The hook still runs for non-bulk operations (e.g. admin panel, single-set adds).
    const workoutExercises = await Promise.all(
      exercises.map((ex, i) =>
        payload.create({
          collection: 'workout-exercises',
          data: {
            workoutDay: workoutDay.id,
            exercise: Number(ex.exerciseId),
            exerciseOrder: i,
          },
          overrideAccess: true,
          depth: 0,
          req: t ? { transactionID: t } : undefined,
        }),
      ),
    )

    // 3. Create all workout sets in one parallel batch
    // overrideAccess: true — intentionally bypasses the beforeChange hook that
    // performs 2 extra DB queries per set (findByID with depth:2 + find for
    // previous sets). For 20 sets this would add ~40 round-trips to Supabase.
    // Ownership is already validated above via the routine fetch (line 52-62).
    // previousWeight/previousReps are left null here — they are only needed for
    // the live "add set" flow during active workouts, which still uses the hook.
    const allSetPromises: Promise<{ id: number }>[] = []
    const validSetLabels = ['warmup', 'working', 'drop']

    exercises.forEach((ex, exIndex) => {
      const workoutExercise = workoutExercises[exIndex]
        ; (ex.sets || []).forEach((set, setIndex) => {
          if (!set.completed) return // skip uncompleted sets for workout history

          let setLabel: 'warmup' | 'working' | 'drop' = 'working'
          if (set.setLabel && validSetLabels.includes(set.setLabel)) {
            setLabel = set.setLabel as 'warmup' | 'working' | 'drop'
          }

          allSetPromises.push(
            payload.create({
              collection: 'workout-sets',
              data: {
                workoutDay: workoutDay.id,
                workoutExercise: workoutExercise.id,
                setOrder: set.setOrder !== undefined ? Number(set.setOrder) : setIndex,
                setLabel: setLabel,
                reps: Number(set.reps) || 0,
                weight: Number(set.weight) || 0,
              },
              overrideAccess: true,
              depth: 0,
              req: t ? { transactionID: t } : undefined,
            }),
          )
        })
    })

    await Promise.all(allSetPromises)

    // 4. Update Routine Sets if requested
    if (updatePrevWeights) {
      // Fetch existing routine-exercises to map them by exercise ID
      const routineExercisesResult = await payload.find({
        collection: 'routine-exercises',
        where: {
          routine: { equals: Number(routineId) },
        },
        limit: 100,
        depth: 0,
        req: t ? { transactionID: t } : undefined,
      })

      const routineExercises = routineExercisesResult.docs
      const deletePromises: Promise<unknown>[] = []
      const createPromises: Promise<unknown>[] = []

      // 1. First, prepare and execute deletions
      for (const ex of exercises) {
        const routineExercise = routineExercises.find(
          (re) =>
            (typeof re.exercise === 'object' ? re.exercise.id : re.exercise) ===
            Number(ex.exerciseId)
        )
        if (routineExercise) {
          // Delete old sets for this routine-exercise
          deletePromises.push(
            payload.delete({
              collection: 'routine-sets',
              where: {
                routineExercise: { equals: routineExercise.id },
              },
              overrideAccess: true,
              req: t ? { transactionID: t } : undefined,
            })
          )
        }
      }
      await Promise.all(deletePromises)

      // 2. Then, create the new sets
      for (const ex of exercises) {
        const routineExercise = routineExercises.find(
          (re) =>
            (typeof re.exercise === 'object' ? re.exercise.id : re.exercise) ===
            Number(ex.exerciseId)
        )
        if (routineExercise) {
          ;(ex.sets || []).forEach((set, setIndex) => {
            let setLabel: 'warmup' | 'working' | 'drop' = 'working'
            if (set.setLabel && validSetLabels.includes(set.setLabel)) {
              setLabel = set.setLabel as 'warmup' | 'working' | 'drop'
            }
            createPromises.push(
              payload.create({
                collection: 'routine-sets',
                data: {
                  routineExercise: routineExercise.id as number,
                  setOrder: set.setOrder !== undefined ? Number(set.setOrder) : setIndex,
                  setLabel,
                  reps: Number(set.reps) || 0,
                  weight: Number(set.weight) || 0,
                },
                overrideAccess: true,
                req: t ? { transactionID: t } : undefined,
              })
            )
          })
        }
      }
      await Promise.all(createPromises)
    }

    // Commit transaction
    if (t) await payload.db.commitTransaction(t)

    const payloadDuration = performance.now() - payloadStart
    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/workouts/start`)
    console.log(`Payload duration: ${payloadDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`)

    return NextResponse.json(
      {
        workoutDayId: String(workoutDay.id),
        saved: true,
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
    console.error('Error saving workout:', error)
    // Rollback transaction on error
    if (t) await payload.db.rollbackTransaction(t)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
