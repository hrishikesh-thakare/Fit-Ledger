import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  // Cast ID to number
  const numericUserId = Number(userId)

  const payload = await getPayload({ config })

  try {
    // 1. Fetch all active routines for this user
    // Optimized: Select only needed fields, depth 0
    const routinesResponse = await payload.find({
      collection: 'routines',
      where: {
        user: {
          equals: numericUserId,
        },
        isActive: {
          equals: 'active',
        },
      },
      sort: '-createdAt',
      limit: 100,
      depth: 0,
      select: {
        name: true,
        notes: true,
        id: true,
      },
    })

    const routines = routinesResponse.docs

    // 2. Efficiently get exercise counts and set counts
    const routineIds = routines.map((r) => r.id)

    // Maps to store counts
    const exerciseCounts: Record<string, number> = {}
    const setCounts: Record<string, number> = {}
    routineIds.forEach((id) => {
      exerciseCounts[id] = 0
      setCounts[id] = 0
    })

    if (routineIds.length > 0) {
      // Fetch all routine-exercises for these routines
      const routineExercises = await payload.find({
        collection: 'routine-exercises',
        where: {
          routine: {
            in: routineIds,
          },
        },
        limit: 5000,
        depth: 0,
        select: {
          routine: true,
        },
      })

      // Count exercises and collect routine-exercise IDs
      const routineExerciseIds: number[] = []
      const reToRoutine: Record<string, string> = {} // routineExerciseId -> routineId

      routineExercises.docs.forEach((re) => {
        const rId = typeof re.routine === 'object' ? re.routine.id : re.routine
        const rIdStr = String(rId)
        if (exerciseCounts[rIdStr] !== undefined) {
          exerciseCounts[rIdStr]++
        }
        routineExerciseIds.push(re.id as number)
        reToRoutine[String(re.id)] = rIdStr
      })

      // Fetch all sets for these routine-exercises to count total sets per routine
      if (routineExerciseIds.length > 0) {
        const routineSets = await payload.find({
          collection: 'routine-sets',
          where: {
            routineExercise: {
              in: routineExerciseIds,
            },
          },
          limit: 5000,
          depth: 0,
          select: {
            routineExercise: true,
          },
        })

        routineSets.docs.forEach((set) => {
          const reId =
            typeof set.routineExercise === 'object' ? set.routineExercise.id : set.routineExercise
          const routineId = reToRoutine[String(reId)]
          if (routineId && setCounts[routineId] !== undefined) {
            setCounts[routineId]++
          }
        })
      }
    }

    // Helper to format estimated duration (~3 min per set)
    const formatDuration = (totalSets: number): string => {
      if (totalSets === 0) return '~0m'
      const minutes = Math.round(totalSets * 3)
      if (minutes >= 60) {
        const hrs = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs}h`
      }
      return `~${minutes}m`
    }

    // 3. Construct response
    const results = routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      description: routine.notes || '',
      notes: routine.notes || null,
      exerciseCount: exerciseCounts[String(routine.id)] || 0,
      duration: formatDuration(setCounts[String(routine.id)] || 0),
      lastPerformed: '-',
    }))

    return NextResponse.json(
      { docs: results },
      {
        headers: {
          // Short cache for user-specific data - 10s cache, revalidate in background
          'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching routines:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
