import { getPayload } from 'payload'
import config from '@payload-config'
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const routineId = Number(id) // Cast to number
  const payload = await getPayload({ config })
  const data: SaveRoutinePayload = await req.json()

  try {
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

    // 3. Process Exercises
    const keptREIds = new Set<string>()
    const processedREPromises = data.exercises.map(async (exInput, index) => {
      let reId = exInput.id

      // Check if it's a new or existing RE
      // Note: Frontend might send string ID, DB has number. We compare as strings.
      const isNew = !reId || !routineExerciseMap.has(reId)

      // Cast IDs to numbers for payload operations
      const numericExerciseId = Number(exInput.exerciseId)

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
      } else {
        // Update existing RoutineExercise (order might change)
        const numericReId = Number(reId)
        await payload.update({
          collection: 'routine-exercises',
          id: numericReId,
          data: {
            exerciseOrder: index,
          },
        })
      }

      if (reId) keptREIds.add(reId)

      // 4. Process Sets for this Exercise
      const currentSets = exInput.sets
      const keptSetIds = new Set<string>()

      const setPromises = currentSets.map(async (setInput, setIndex) => {
        let setId = setInput.id
        const isSetNew = !setId || !routineSetMap.has(setId)
        const numericReIdForSet = Number(reId) // Ensure it's a number

        const setPayload = {
          routineExercise: numericReIdForSet,
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
          const newSet = await payload.create({
            collection: 'routine-sets',
            data: setPayload,
          })
          setId = String(newSet.id)
        } else {
          const numericSetId = Number(setId)
          await payload.update({
            collection: 'routine-sets',
            id: numericSetId,
            data: setPayload,
          })
        }
        if (setId) keptSetIds.add(setId)
      })

      await Promise.all(setPromises)

      // Delete orphaned sets for this exercise
      const orphanedSets = existingRoutineSets.docs.filter((rs) => {
        const rsReId =
          typeof rs.routineExercise === 'object' ? rs.routineExercise.id : rs.routineExercise
        return String(rsReId) === reId && !keptSetIds.has(String(rs.id))
      })

      const deleteSetPromises = orphanedSets.map((rs) =>
        payload.delete({ collection: 'routine-sets', id: rs.id }),
      )
      await Promise.all(deleteSetPromises)
    })

    await Promise.all(processedREPromises)

    // 5. Delete Orphaned Routine Exercises
    const orphanedREs = existingRoutineExercises.docs.filter((re) => !keptREIds.has(String(re.id)))

    const deleteREPromises = orphanedREs.map(async (re) => {
      const setsToDelete = existingRoutineSets.docs.filter((rs) => {
        const rsReId =
          typeof rs.routineExercise === 'object' ? rs.routineExercise.id : rs.routineExercise
        return String(rsReId) === String(re.id)
      })

      await Promise.all(
        setsToDelete.map((rs) => payload.delete({ collection: 'routine-sets', id: rs.id })),
      )
      await payload.delete({ collection: 'routine-exercises', id: re.id })
    })

    await Promise.all(deleteREPromises)

    return NextResponse.json({ success: true, id: routineId })
  } catch (error) {
    console.error('Error saving routine:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
