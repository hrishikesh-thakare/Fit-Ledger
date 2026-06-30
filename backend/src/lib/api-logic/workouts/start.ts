import type { Payload } from 'payload'

interface WorkoutSetData {
  weight: string | number
  reps: string | number
  setLabel?: string
  completed?: boolean
  setOrder?: number
  previousWeight?: string | number
  previousReps?: string | number
  displayLabel?: string
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
  requestUserId: string | number,
): Promise<{ status: number; body: unknown }> {
  const { clientId, routineId, date = new Date().toISOString(), durationSeconds = 0, updatePrevWeights = false, exercises } = body

  if (!routineId || !exercises) {
    return { status: 400, body: { error: 'routineId and exercises are required' } }
  }

  if (exercises.length > 50) {
    return { status: 400, body: { error: 'Too many exercises in one workout' } }
  }

  const routine = await payload.findByID({
    collection: 'routines',
    id: Number(routineId),
    depth: 0,
    overrideAccess: true,
  })

  if (!routine) {
    return { status: 404, body: { error: 'Routine not found' } }
  }

  const userId = typeof routine.user === 'object' ? routine.user?.id : routine.user
  if (String(userId) !== String(requestUserId)) {
    return { status: 403, body: { error: 'Forbidden' } }
  }

  let totalVolumeKg = 0
  exercises.forEach((ex) => {
    ;(ex.sets || []).forEach((set) => {
      if (!set.completed) return
      totalVolumeKg += (Number(set.weight) || 0) * (Number(set.reps) || 0)
    })
  })
  const exerciseCount = exercises.length

  if (clientId) {
    const existing = await payload.find({
      collection: 'workout-days',
      where: { clientId: { equals: clientId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
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

  const workoutDay = await payload.create({
    collection: 'workout-days',
    data: {
      user: Number(userId),
      routine: Number(routineId),
      title: routine.name,
      date,
      durationSeconds,
      volumeKg: totalVolumeKg,
      exerciseCount,
      ...(clientId ? { clientId } : {}),
    },
    overrideAccess: true,
  })

  try {

    const workoutExercisesTable = payload.db.tables['workout_exercises']
    const workoutExercises = await payload.db.drizzle
      .insert(workoutExercisesTable)
      .values(
        exercises.map((ex, exerciseOrder) => ({
          workoutDay: Number(workoutDay.id),
          exercise: Number(ex.exerciseId),
          exerciseOrder: exerciseOrder,
        }))
      )
      .returning()
    
    const workoutExerciseIdsByOrder = new Map<number, number>(
      (workoutExercises as { id: number | string; exerciseOrder: number | string }[]).map((exercise) => [
        Number(exercise.exerciseOrder), 
        Number(exercise.id)
      ]),
    )

    const validSetLabels = ['warmup', 'working', 'drop']

    type NewWorkoutSet = {
      workoutDay: number
      workoutExercise: number
      setOrder: number
      setLabel: 'warmup' | 'working' | 'drop'
      reps: number
      weight: number
      previousWeight: number | null
      previousReps: number | null
      displayLabel: string | null
    }
    const workoutSetsToInsert: NewWorkoutSet[] = []

    exercises.forEach((ex, exIndex) => {
      const workoutExerciseId = workoutExerciseIdsByOrder.get(exIndex)
      if (!workoutExerciseId) {
        throw new Error(`Workout exercise ${exIndex} was not created`)
      }
      ;(ex.sets || []).forEach((set, setIndex) => {
        if (!set.completed) return

        let setLabel: 'warmup' | 'working' | 'drop' = 'working'
        if (set.setLabel && validSetLabels.includes(set.setLabel)) {
          setLabel = set.setLabel as 'warmup' | 'working' | 'drop'
        }

        workoutSetsToInsert.push({
          workoutDay: Number(workoutDay.id),
          workoutExercise: workoutExerciseId,
          setOrder: set.setOrder !== undefined ? Number(set.setOrder) : setIndex,
          setLabel: setLabel,
          reps: Number(set.reps) || 0,
          weight: Number(set.weight) || 0,
          previousWeight: set.previousWeight !== undefined ? Number(set.previousWeight) : null,
          previousReps: set.previousReps !== undefined ? Number(set.previousReps) : null,
          displayLabel: set.displayLabel || null,
        })
      })
    })

    if (workoutSetsToInsert.length > 0) {
      const workoutSetsTable = payload.db.tables['workout_sets']
      await payload.db.drizzle.insert(workoutSetsTable).values(workoutSetsToInsert)
    }

    if (updatePrevWeights) {
      const routineExercisesResult = await payload.find({
        collection: 'routine-exercises',
        where: { routine: { equals: Number(routineId) } },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })

      const routineExercises = routineExercisesResult.docs
      const routineExerciseIdsToDelete: number[] = []
      for (const ex of exercises) {
        const routineExercise = routineExercises.find(
          (re) => (typeof re.exercise === 'object' ? re.exercise.id : re.exercise) === Number(ex.exerciseId),
        )
        if (routineExercise) {
          routineExerciseIdsToDelete.push(routineExercise.id)
        }
      }

      if (routineExerciseIdsToDelete.length > 0) {
        await Promise.all(
          routineExerciseIdsToDelete.map((id) =>
            payload.delete({
              collection: 'routine-sets',
              where: { routineExercise: { equals: id } },
              overrideAccess: true,
            })
          )
        )
      }

      type NewRoutineSet = {
        routineExercise: number
        setOrder: number
        setLabel: 'warmup' | 'working' | 'drop'
        reps: number
        weight: number
      }
      const routineSetsToInsert: NewRoutineSet[] = []
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
            routineSetsToInsert.push({
              routineExercise: routineExercise.id as number,
              setOrder: set.setOrder !== undefined ? Number(set.setOrder) : setIndex,
              setLabel: setLabel,
              reps: Number(set.reps) || 0,
              weight: Number(set.weight) || 0,
            })
          })
        }
      }

      if (routineSetsToInsert.length > 0) {
        const routineSetsTable = payload.db.tables['routine_sets']
        await payload.db.drizzle.insert(routineSetsTable).values(routineSetsToInsert)
      }
    }

    return {
      status: 200,
      body: {
        workoutDayId: String(workoutDay.id),
        saved: true,
      },
    }
  } catch (error) {
    console.error('Error in bulk insert, rolling back workoutDay:', error)
    await payload.delete({
      collection: 'workout-days',
      id: workoutDay.id,
      overrideAccess: true,
    }).catch(() => null)
    
    throw error
  }
}
