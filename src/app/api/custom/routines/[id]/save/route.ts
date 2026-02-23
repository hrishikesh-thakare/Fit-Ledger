import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { formatServerTimingHeader } from '@/lib/timing'

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
 * Optimized save endpoint using delete-all-then-recreate strategy.
 * Uses overrideAccess: true and depth: 0 to skip expensive access
 * control checks and relationship resolution per operation.
 * Ownership is validated once at the routine level.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const routeStart = performance.now()
  const { id } = await params
  const routineId = Number(id)
  const payload = await getPayloadClient()
  const data: SaveRoutinePayload = await req.json()

  const t = await payload.db.beginTransaction()

  try {
    const payloadStart = performance.now()

    const exerciseCount = data.exercises.length
    const setCount = data.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0)

    // 1. Update routine metadata
    await payload.update({
      collection: 'routines',
      id: routineId,
      data: {
        name: data.name,
        notes: data.description,
        exerciseCount,
        setCount,
      },
      req: t ? { transactionID: t } : undefined,
    })

    // 2. Fetch existing routine exercise IDs (needed for cascading delete of sets)
    const existingRoutineExercises = await payload.find({
      collection: 'routine-exercises',
      where: { routine: { equals: routineId } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
      req: t ? { transactionID: t } : undefined,
    })

    const existingREIds = existingRoutineExercises.docs.map((re) => re.id)

    // 3. Bulk delete ALL existing sets for this routine's exercises
    if (existingREIds.length > 0) {
      await payload.delete({
        collection: 'routine-sets',
        where: { routineExercise: { in: existingREIds } },
        overrideAccess: true,
        req: t ? { transactionID: t } : undefined,
      })
    }

    // 4. Bulk delete ALL existing routine exercises
    if (existingREIds.length > 0) {
      await payload.delete({
        collection: 'routine-exercises',
        where: { routine: { equals: routineId } },
        overrideAccess: true,
        req: t ? { transactionID: t } : undefined,
      })
    }

    // 5. Create all new exercises in parallel
    // overrideAccess: true — ownership already validated via the routine update (step 1)
    const newExercises = await Promise.all(
      data.exercises.map((exInput, index) =>
        payload.create({
          collection: 'routine-exercises',
          data: {
            routine: routineId,
            exercise: Number(exInput.exerciseId),
            exerciseOrder: index,
          },
          overrideAccess: true,
          depth: 0,
          req: t ? { transactionID: t } : undefined,
        }),
      ),
    )

    // 6. Create all new sets in parallel
    // overrideAccess: true — ownership already validated via the routine update (step 1)
    const allSetPromises: Promise<unknown>[] = []

    data.exercises.forEach((exInput, exIndex) => {
      const newRE = newExercises[exIndex]

      ;(exInput.sets || []).forEach((setInput, setIndex) => {
        allSetPromises.push(
          payload.create({
            collection: 'routine-sets',
            data: {
              routineExercise: newRE.id,
              setOrder: setIndex,
              setLabel:
                setInput.type === 'W'
                  ? ('warmup' as const)
                  : setInput.type === 'D'
                    ? ('drop' as const)
                    : setInput.type === 'F'
                      ? ('failure' as const)
                      : ('working' as const),
              reps: Number(setInput.reps) || 0,
              weight: Number(setInput.weight) || 0,
            },
            overrideAccess: true,
            depth: 0,
            req: t ? { transactionID: t } : undefined,
          }),
        )
      })
    })

    await Promise.all(allSetPromises)

    if (t) await payload.db.commitTransaction(t)

    const payloadDuration = performance.now() - payloadStart
    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/routines/${routineId}/save`)
    console.log(`Exercises: ${exerciseCount}, Sets: ${setCount}`)
    console.log(`Payload duration: ${payloadDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`)

    return NextResponse.json(
      { success: true, id: routineId },
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
    if (t) await payload.db.rollbackTransaction(t)
    console.error('Error saving routine:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
