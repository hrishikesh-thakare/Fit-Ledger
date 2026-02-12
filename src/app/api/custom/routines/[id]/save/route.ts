import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { RoutineExercise, RoutineSet } from '@/payload-types'

interface SetInput {
  id?: string
  type: string
  weight: string
  reps: string
}

interface ExerciseInput {
  id?: string // RoutineExercise ID or "temp-..."
  exerciseId: string // Exercise ID
  order: number
  sets: SetInput[]
}

interface SaveRoutinePayload {
  name: string
  description?: string
  exercises: ExerciseInput[]
}

import { formatServerTimingHeader } from '@/lib/timing'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const routeStart = performance.now()
  const { id } = await params
  const routineId = Number(id) // Cast to number
  const payload = await getPayloadClient()
  const data: SaveRoutinePayload = await req.json()

  try {
    const payloadStart = performance.now()

    // 1. Update Routine Info
    await payload.update({
      collection: 'routines',
      id: routineId,
      data: {
        name: data.name,
        notes: data.description,
      },
    })

    // 2. Fetch Existing Routine Exercises & Sets
    const existingRoutineExercises = await payload.find({
      collection: 'routine-exercises',
      where: { routine: { equals: routineId } },
      limit: 500,
    })

    const existingREIds = existingRoutineExercises.docs.map((re) => re.id)

    const existingRoutineSets =
      existingREIds.length > 0
        ? await payload.find({
            collection: 'routine-sets',
            where: { routineExercise: { in: existingREIds } },
            limit: 2000,
          })
        : { docs: [] }

    // Map existing records for quick lookup
    const routineExerciseMap = new Map<string, RoutineExercise>()
    existingRoutineExercises.docs.forEach((re) => routineExerciseMap.set(String(re.id), re))

    const routineSetMap = new Map<string, RoutineSet>()
    existingRoutineSets.docs.forEach((rs) => routineSetMap.set(String(rs.id), rs as RoutineSet))

    // 3. Prepare Bulk Operations
    const keptREIds = new Set<string>()
    const allSetPromises: Promise<unknown>[] = []

    // We'll process exercises in parallel
    const processedREPromises = data.exercises.map(async (exInput, index) => {
      let reId = exInput.id
      const isNew = !reId || !routineExerciseMap.has(reId)
      const numericExerciseId = Number(exInput.exerciseId)

      let numericReId: number

      if (isNew) {
        // Create new RoutineExercise
        const newRE = await payload.create({
          collection: 'routine-exercises',
          data: {
            routine: routineId,
            exercise: numericExerciseId,
            exerciseOrder: index,
          },
        })
        reId = String(newRE.id)
        numericReId = newRE.id
      } else {
        // Update existing RoutineExercise
        // Only update if order changed to save IO?
        // For now, just update to be safe and simple.
        numericReId = Number(reId)
        await payload.update({
          collection: 'routine-exercises',
          id: numericReId,
          data: {
            exerciseOrder: index,
          },
        })
      }

      if (reId) keptREIds.add(reId)

      // Process Sets for this Exercise
      const currentSets = exInput.sets
      const keptSetIdsForThisRE = new Set<string>()

      currentSets.forEach((setInput, setIndex) => {
        const setId = setInput.id
        const isSetNew = !setId || !routineSetMap.has(setId)

        const setPayload = {
          routineExercise: numericReId,
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
        }

        if (isSetNew) {
          allSetPromises.push(
            payload
              .create({
                collection: 'routine-sets',
                data: setPayload,
              })
              .then((newSet) => keptSetIdsForThisRE.add(String(newSet.id))),
          )
        } else {
          // If existing, we track it immediately as kept, then update
          keptSetIdsForThisRE.add(String(setId))
          allSetPromises.push(
            payload.update({
              collection: 'routine-sets',
              id: Number(setId),
              data: setPayload,
            }),
          )
        }
      })

      return keptSetIdsForThisRE
    })

    // Wait for all Exercises to be created/updated so we have valid IDs
    const setsKeptSets = await Promise.all(processedREPromises)

    // Flatten all kept set IDs
    const allKeptSetIds = new Set<string>()
    setsKeptSets.forEach((s) => s.forEach((id) => allKeptSetIds.add(id)))

    // Wait for all Set creations/updates to finish
    await Promise.all(allSetPromises)

    // 4. Bulk Delete Orphaned Sets
    // Identify sets that are in DB but not in kept list
    const setsToDelete = existingRoutineSets.docs
      .filter((rs) => !allKeptSetIds.has(String(rs.id)))
      .map((rs) => rs.id)

    if (setsToDelete.length > 0) {
      await payload.delete({
        collection: 'routine-sets',
        where: {
          id: { in: setsToDelete },
        },
      })
    }

    // 5. Bulk Delete Orphaned Routine Exercises
    const resToDelete = existingRoutineExercises.docs
      .filter((re) => !keptREIds.has(String(re.id)))
      .map((re) => re.id)

    if (resToDelete.length > 0) {
      // Also delete sets associated with these REs (though they should be caught above if logic holds,
      // but strictly speaking orphaned REs implies their sets are also orphaned)
      // The above logic for sets relies on "keptSetIds".
      // If an RE is removed, its sets won't be in data.exercises, so they won't be in allKeptSetIds, so they get deleted.
      // So we just need to delete the REs themselves.

      await payload.delete({
        collection: 'routine-exercises',
        where: {
          id: { in: resToDelete },
        },
      })
    }

    const payloadDuration = performance.now() - payloadStart
    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/routines/${routineId}/save`)
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
    console.error('Error saving routine:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
