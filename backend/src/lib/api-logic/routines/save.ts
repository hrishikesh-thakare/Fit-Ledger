import type { Payload } from 'payload'

interface SetInput {
  id?: string
  type: string
  weight: string
  reps: string
}

interface ExerciseInput {
  id?: string
  exerciseId: string
  order: number
  sets: SetInput[]
}

interface SaveRoutinePayload {
  name: string
  description?: string
  exercises: ExerciseInput[]
}

export async function saveRoutineToPayload(
  payload: Payload,
  params: { id: string; user: { id: string | number; role?: string } },
  data: SaveRoutinePayload,
): Promise<{ status: number; body: unknown }> {
  const { id, user } = params

  if (!data.name?.trim()) {
    return { status: 400, body: { error: 'Routine name is required' } }
  }

  const exerciseCount = data.exercises.length
  const setCount = data.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0)

  let finalRoutineId = 0

  const t = await payload.db.beginTransaction()

  try {
    if (id === 'new') {
      const newRoutine = await payload.create({
        collection: 'routines',
        data: {
          name: data.name,
          notes: data.description || null,
          exerciseCount,
          setCount,
          user: Number(user.id),
          isActive: 'active',
        },
        overrideAccess: true,
        req: t ? { transactionID: t } : undefined,
      })

      finalRoutineId = Number(newRoutine.id)
    } else {
      finalRoutineId = Number(id)

      if (user.role !== 'admin') {
        const existingRoutine = await payload.findByID({
          collection: 'routines',
          id: finalRoutineId,
          depth: 0,
          overrideAccess: true,
          req: t ? { transactionID: t } : undefined,
        })

        if (!existingRoutine) {
          throw new Error('NOT_FOUND_OR_UNAUTHORIZED')
        }

        const routineUserId = typeof existingRoutine.user === 'object' ? existingRoutine.user?.id : existingRoutine.user
        if (String(routineUserId) !== String(user.id)) {
          throw new Error('NOT_FOUND_OR_UNAUTHORIZED')
        }
      }

      await payload.update({
        collection: 'routines',
        id: finalRoutineId,
        data: {
          name: data.name,
          notes: data.description || null,
          exerciseCount,
          setCount,
        },
        overrideAccess: true,
        req: t ? { transactionID: t } : undefined,
      })

      const existingREs = await payload.find({
        collection: 'routine-exercises',
        where: { routine: { equals: finalRoutineId } },
        limit: 100,
        depth: 0,
        overrideAccess: true,
        req: t ? { transactionID: t } : undefined,
      })
      
      const existingREIds = existingREs.docs.map((re) => Number(re.id))

      if (existingREIds.length > 0) {
        await payload.delete({
          collection: 'routine-sets',
          where: { routineExercise: { in: existingREIds } },
          overrideAccess: true,
          req: t ? { transactionID: t } : undefined,
        })

        await payload.delete({
          collection: 'routine-exercises',
          where: { routine: { equals: finalRoutineId } },
          overrideAccess: true,
          req: t ? { transactionID: t } : undefined,
        })
      }
    }

    if (data.exercises.length > 0) {
      const newExercises = await Promise.all(
        data.exercises.map((exInput, index) =>
          payload.create({
            collection: 'routine-exercises',
            data: {
              routine: finalRoutineId,
              exercise: Number(exInput.exerciseId),
              exerciseOrder: index,
            },
            overrideAccess: true,
            req: t ? { transactionID: t } : undefined,
          })
        )
      )

      type NewRoutineSet = {
        routineExercise: number
        setOrder: number
        setLabel: 'warmup' | 'drop' | 'working'
        reps: number
        weight: number
      }
      const setRows: NewRoutineSet[] = []

      data.exercises.forEach((exInput, exIndex) => {
        const newREId = Number(newExercises[exIndex].id)
        ;(exInput.sets || []).forEach((setInput, setIndex) => {
          setRows.push({
            routineExercise: newREId,
            setOrder: setIndex,
            setLabel:
              setInput.type === 'W'
                ? 'warmup'
                : setInput.type === 'D'
                  ? 'drop'
                  : 'working',
            reps: Number(setInput.reps) || 0,
            weight: Number(setInput.weight) || 0,
          })
        })
      })

      if (setRows.length > 0) {
        await Promise.all(
          setRows.map((data) =>
            payload.create({
              collection: 'routine-sets',
              data,
              overrideAccess: true,
              req: t ? { transactionID: t } : undefined,
            })
          )
        )
      }
    }

    if (t) await payload.db.commitTransaction(t)

    return { status: 200, body: { success: true, id: finalRoutineId } }
  } catch (error) {
    if (t) await payload.db.rollbackTransaction(t)
    throw error
  }
}
