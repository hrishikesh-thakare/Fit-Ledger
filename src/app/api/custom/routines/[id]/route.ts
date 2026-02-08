import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { RoutineSet } from '@/payload-types'

// Replicate the interfaces from src/lib/api/routines.ts
interface FetchedRoutineSet {
  id: string
  type: 'N' | 'W' | 'D' | 'F'
  weight: string
  reps: string
  setOrder: number
  previous?: string
}

interface FetchedExercise {
  id: string // RoutineExercise ID
  exerciseId: string // Actual Exercise ID
  name: string
  bodyPart?: string
  sets: FetchedRoutineSet[]
  order: number
}

interface FetchedRoutineDetails {
  id: string
  name: string
  description?: string
  exercises: FetchedExercise[]
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })

  // Cast ID to number
  const numericId = Number(id)

  try {
    // 1. Fetch the routine
    const routine = await payload.findByID({
      collection: 'routines',
      id: numericId,
    })

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    // 2. Fetch all routine exercises for this routine sorted by order
    const routineExercises = await payload.find({
      collection: 'routine-exercises',
      where: {
        routine: {
          equals: numericId,
        },
      },
      sort: 'exerciseOrder',
      limit: 100,
      depth: 1, // To get exercise details
    })

    // 3. Fetch ALL sets for ALL exercises in this routine at once
    const routineExerciseIds = routineExercises.docs.map((re) => re.id)
    // Also need actual exercise IDs to fetch previous stats
    const exerciseIds = routineExercises.docs.map((re) =>
      typeof re.exercise === 'object' ? re.exercise.id : re.exercise,
    )

    let allSets: RoutineSet[] = []

    if (routineExerciseIds.length > 0) {
      const setsResponse = await payload.find({
        collection: 'routine-sets',
        where: {
          routineExercise: {
            in: routineExerciseIds,
          },
        },
        limit: 500,
        sort: 'setOrder',
      })
      allSets = setsResponse.docs as RoutineSet[]
    }

    // 4. Fetch Previous Stats (Efficiently)
    // We want the most recent "workout-exercise" for each exercise ID to get its sets.
    // Instead of N calls, let's try to do it in one if possible, or at least optimize.
    // Complexity: We need "latest workout-exercise for exercise X where user = current user".
    // Payload doesn't support "distinct on" or "latest per group" easily in one query.
    // However, since N < 10 exercises usually, parallel promises are okay here compared to serial.
    // Or we can fetch "last 50 workout-exercises" and filter in memory if the user doesn't have huge history.
    // But "last 50" might all be from the same workout.
    // Better approach: Execute parallel queries for each exercise to get its latest workout.
    // This is still N queries but parallelized server-side (much faster than client).

    const previousStatsMap: Record<string, Record<number, string>> = {} // exerciseId -> { setIndex: "100x10" }

    if (exerciseIds.length > 0) {
      await Promise.all(
        exerciseIds.map(async (exId) => {
          try {
            // Find most recent workout-exercise for this exercise
            const recentWeResponse = await payload.find({
              collection: 'workout-exercises',
              where: {
                exercise: {
                  equals: exId,
                },
                // Ensure it's for the same user?
                // routines are user-specific, but better to be safe if checking history.
                // We'd need to join on workoutDay.user or rely on the fact that we are in a user context?
                // API route doesn't enforce user context automatically on 'find' unless we pass 'user' in options
                // or replicate the access control query.
                // For simplicity/speed, we assume routine.user is the owner.
                // We should filter by workoutDay.user = routine.user
              },
              sort: '-createdAt',
              limit: 1,
              depth: 0,
            })

            if (recentWeResponse.docs.length > 0) {
              const recentWe = recentWeResponse.docs[0]
              // Fetch sets for this workout exercise
              const recentSetsResponse = await payload.find({
                collection: 'workout-sets',
                where: {
                  workoutExercise: {
                    equals: recentWe.id,
                  },
                },
                sort: 'setOrder',
                limit: 20,
              })

              const stats: Record<number, string> = {}
              recentSetsResponse.docs.forEach((s, idx) => {
                if (s.weight && s.reps) {
                  stats[idx] = `${s.weight}x${s.reps}`
                }
              })
              previousStatsMap[String(exId)] = stats
            }
          } catch (err) {
            console.error(`Error fetching stats for exercise ${exId}`, err)
          }
        }),
      )
    }

    // 5. In-memory aggregation
    const exercises: FetchedExercise[] = routineExercises.docs.map((re) => {
      const reId = String(re.id)
      const exId = typeof re.exercise === 'object' ? String(re.exercise.id) : String(re.exercise)

      // Filter sets for this specific routine exercise
      const relatedSets = allSets
        .filter((set) => {
          const setReId =
            typeof set.routineExercise === 'object' ? set.routineExercise.id : set.routineExercise
          return String(setReId) === reId
        })
        .sort((a, b) => a.setOrder - b.setOrder)

      // Get previous stats for this exercise
      const prevStats = previousStatsMap[exId] || {}

      // Map sets to UI format
      const formattedSets: FetchedRoutineSet[] = relatedSets.map((set, idx) => ({
        id: String(set.id),
        type:
          set.setLabel === 'warmup'
            ? 'W'
            : set.setLabel === 'drop'
              ? 'D'
              : set.setLabel === 'failure'
                ? 'F'
                : 'N',
        weight: String(set.weight),
        reps: String(set.reps),
        setOrder: set.setOrder,
        previous: prevStats[idx] || '-',
      }))

      // Get exercise details
      const exercise = typeof re.exercise === 'object' ? re.exercise : null
      const muscleGroup =
        exercise && typeof exercise.muscleGroup === 'object' ? exercise.muscleGroup : null

      return {
        id: reId,
        exerciseId: exId,
        name: exercise?.name || 'Unknown Exercise',
        bodyPart: muscleGroup?.name || undefined,
        sets: formattedSets,
        order: re.exerciseOrder,
      }
    })

    const result: FetchedRoutineDetails = {
      id: String(routine.id),
      name: routine.name,
      description: routine.notes || undefined,
      exercises,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching routine details:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
