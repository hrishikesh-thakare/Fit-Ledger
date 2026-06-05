import type { Payload } from 'payload'

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

export async function saveWorkoutToPayload(
  payload: Payload,
  body: SaveWorkoutRequest,
): Promise<{ status: number; body: unknown }> {
  const { clientId, routineId, date = new Date().toISOString(), durationSeconds = 0, updatePrevWeights = false, exercises } = body

  if (!routineId || !exercises) {
    return { status: 400, body: { error: 'routineId and exercises are required' } }
  }

  const routine = await payload.findByID({
    collection: 'routines',
    id: Number(routineId),
    depth: 0,
  })

  if (!routine) {
    return { status: 404, body: { error: 'Routine not found' } }
  }

  let totalVolumeKg = 0
  exercises.forEach((ex) => {
    ;(ex.sets || []).forEach((set) => {
      totalVolumeKg += (Number(set.weight) || 0) * (Number(set.reps) || 0)
    })
  })
  const exerciseCount = exercises.length

  const userId = typeof routine.user === 'object' ? routine.user.id : routine.user

  if (clientId) {
    const existing = await payload.find({
      collection: 'workout-days',
      where: { clientId: { equals: clientId } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length > 0) {
      return {
        status: 200,
        body: {
          workoutDayId: String(existing.docs[0].id),
          saved: true,
          deduplicated: true,
        },
      }
    }
  }

  const t = await payload.db.beginTransaction()
  try {
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

    const allSetPromises: Promise<unknown>[] = []
    const validSetLabels = ['warmup', 'working', 'drop']

    exercises.forEach((ex, exIndex) => {
      const workoutExercise = workoutExercises[exIndex]
      ;(ex.sets || []).forEach((set, setIndex) => {
        if (!set.completed) return

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
              setLabel,
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

    if (updatePrevWeights) {
      const routineExercisesResult = await payload.find({
        collection: 'routine-exercises',
        where: { routine: { equals: Number(routineId) } },
        limit: 100,
        depth: 0,
        req: t ? { transactionID: t } : undefined,
      })

      const routineExercises = routineExercisesResult.docs
      const deletePromises: Promise<unknown>[] = []
      const createPromises: Promise<unknown>[] = []

      for (const ex of exercises) {
        const routineExercise = routineExercises.find(
          (re) => (typeof re.exercise === 'object' ? re.exercise.id : re.exercise) === Number(ex.exerciseId),
        )
        if (routineExercise) {
          deletePromises.push(
            payload.delete({
              collection: 'routine-sets',
              where: {
                routineExercise: { equals: routineExercise.id },
              },
              overrideAccess: true,
              req: t ? { transactionID: t } : undefined,
            }),
          )
        }
      }
      await Promise.all(deletePromises)

      for (const ex of exercises) {
        const routineExercise = routineExercises.find(
          (re) => (typeof re.exercise === 'object' ? re.exercise.id : re.exercise) === Number(ex.exerciseId),
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
              }),
            )
          })
        }
      }
      await Promise.all(createPromises)
    }

    if (t) await payload.db.commitTransaction(t)

    return {
      status: 200,
      body: {
        workoutDayId: String(workoutDay.id),
        saved: true,
      },
    }
  } catch (error) {
    if (t) await payload.db.rollbackTransaction(t)
    throw error
  }
}
