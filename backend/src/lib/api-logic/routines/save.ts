import { and, eq, inArray } from 'drizzle-orm'
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
  const db = (payload.db as unknown as { drizzle: unknown; tables: Record<string, unknown> }).drizzle as any
  const tables = (payload.db as unknown as { tables: Record<string, any> }).tables

  const routinesTable = tables.routines
  const reTable = tables.routine_exercises
  const rsTable = tables.routine_sets

  const exerciseCount = data.exercises.length
  const setCount = data.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0)
  const now = new Date()

  let finalRoutineId = 0

  await db.transaction(async (tx: any) => {
    if (id === 'new') {
      const newRoutine = await tx
        .insert(routinesTable)
        .values({
          name: data.name,
          notes: data.description || null,
          exerciseCount,
          setCount,
          user: user.id,
          isActive: 'active',
          updatedAt: now,
          createdAt: now,
        })
        .returning({ id: routinesTable.id })

      finalRoutineId = newRoutine[0].id
    } else {
      finalRoutineId = Number(id)

      const updateResult = await tx
        .update(routinesTable)
        .set({
          name: data.name,
          notes: data.description || null,
          exerciseCount,
          setCount,
          updatedAt: now,
        })
        .where(
          and(
            eq(routinesTable.id, finalRoutineId),
            user.role === 'admin' ? undefined : eq(routinesTable.user, user.id),
          ),
        )
        .returning({ id: routinesTable.id })

      if (updateResult.length === 0) {
        throw new Error('NOT_FOUND_OR_UNAUTHORIZED')
      }

      const existingREs = await tx.select({ id: reTable.id }).from(reTable).where(eq(reTable.routine, finalRoutineId))
      const existingREIds = existingREs.map((re: { id: number }) => re.id)

      if (existingREIds.length > 0) {
        await tx.delete(rsTable).where(inArray(rsTable.routineExercise, existingREIds))
      }

      if (existingREIds.length > 0) {
        await tx.delete(reTable).where(eq(reTable.routine, finalRoutineId))
      }
    }

    if (data.exercises.length > 0) {
      const exerciseRows = data.exercises.map((exInput, index) => ({
        routine: finalRoutineId,
        exercise: Number(exInput.exerciseId),
        exerciseOrder: index,
        updatedAt: now,
        createdAt: now,
      }))

      const newExercises = await tx.insert(reTable).values(exerciseRows).returning({ id: reTable.id })

      const setRows: { routineExercise: number; setOrder: number; setLabel: string; reps: number; weight: number; updatedAt: Date; createdAt: Date }[] = []

      data.exercises.forEach((exInput, exIndex) => {
        const newREId = newExercises[exIndex].id
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
            updatedAt: now,
            createdAt: now,
          })
        })
      })

      if (setRows.length > 0) {
        await tx.insert(rsTable).values(setRows)
      }
    }
  })

  return { status: 200, body: { success: true, id: finalRoutineId } }
}
