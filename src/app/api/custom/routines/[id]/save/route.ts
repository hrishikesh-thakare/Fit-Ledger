import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { formatServerTimingHeader } from '@/lib/timing'
import { eq, inArray, and } from 'drizzle-orm'

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

/**
 * POST /api/custom/routines/[id]/save
 *
 * Optimized save using direct Drizzle ORM operations, bypassing
 * Payload CMS lifecycle overhead (hooks, validation, serialization).
 *
 * Strategy: delete-all-then-recreate within a DB transaction.
 * Ownership is validated via the routine update step.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const routeStart = performance.now()
  const { id } = await params
  const payload = await getPayloadClient()

  // Authenticate user
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data: SaveRoutinePayload = await req.json()

  // Access Drizzle ORM directly
  const db = (payload.db as any).drizzle
  const tables = (payload.db as any).tables

  const routinesTable = tables.routines
  const reTable = tables.routine_exercises
  const rsTable = tables.routine_sets

  try {
    const payloadStart = performance.now()

    const exerciseCount = data.exercises.length
    const setCount = data.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0)
    const now = new Date()

    let finalRoutineId: number

    // Execute everything in a single Drizzle transaction
    await db.transaction(async (tx: any) => {

      if (id === 'new') {
        // 1. Create a new routine
        const newRoutine = await tx
          .insert(routinesTable)
          .values({
            name: data.name,
            notes: data.description || null,
            exerciseCount,
            setCount,
            user: user.id, // Explicitly set the authenticated user
            isActive: 'active',
            updatedAt: now,
            createdAt: now,
          })
          .returning({ id: routinesTable.id })

        finalRoutineId = newRoutine[0].id
      } else {
        // 1. Update existing routine, ensuring the user owns it
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
              user.role === 'admin' ? undefined : eq(routinesTable.user, user.id)
            )
          )
          .returning({ id: routinesTable.id })

        if (updateResult.length === 0) {
          throw new Error('NOT_FOUND_OR_UNAUTHORIZED')
        }

        // 2. Get existing routine exercise IDs for cascading set deletion
        const existingREs = await tx
          .select({ id: reTable.id })
          .from(reTable)
          .where(eq(reTable.routine, finalRoutineId))

        const existingREIds = existingREs.map((re: any) => re.id)

        // 3. Bulk delete ALL existing sets for this routine's exercises
        if (existingREIds.length > 0) {
          await tx.delete(rsTable).where(inArray(rsTable.routineExercise, existingREIds))
        }

        // 4. Bulk delete ALL existing routine exercises
        if (existingREIds.length > 0) {
          await tx.delete(reTable).where(eq(reTable.routine, finalRoutineId))
        }
      }

      // 5. Bulk create all new exercises (single INSERT statement)
      if (data.exercises.length > 0) {
        const exerciseRows = data.exercises.map((exInput, index) => ({
          routine: finalRoutineId,
          exercise: Number(exInput.exerciseId),
          exerciseOrder: index,
          updatedAt: now,
          createdAt: now,
        }))

        const newExercises = await tx
          .insert(reTable)
          .values(exerciseRows)
          .returning({ id: reTable.id })

        // 6. Bulk create all new sets (single INSERT statement)
        const setRows: any[] = []

        data.exercises.forEach((exInput, exIndex) => {
          const newREId = newExercises[exIndex].id
            ; (exInput.sets || []).forEach((setInput, setIndex) => {
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

    const payloadDuration = performance.now() - payloadStart
    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/routines/${finalRoutineId!}/save`)
    console.log(`Exercises: ${exerciseCount}, Sets: ${setCount}`)
    console.log(`Drizzle duration: ${payloadDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`)

    return NextResponse.json(
      { success: true, id: finalRoutineId! },
      {
        headers: {
          'Server-Timing': formatServerTimingHeader({
            total: totalDuration,
            drizzle: payloadDuration,
          }),
        },
      },
    )
  } catch (error: any) {
    console.error('Error saving routine:', error)
    if (error.message === 'NOT_FOUND_OR_UNAUTHORIZED') {
      return NextResponse.json({ error: 'Routine not found or you do not have permission to edit it' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

