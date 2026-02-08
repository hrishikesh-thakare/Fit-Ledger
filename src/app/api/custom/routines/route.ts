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

    // 2. Efficiently get exercise counts
    // For < 100 routines, fetching all routine-exercises where routine IN [...] is efficiently manageable.

    const routineIds = routines.map((r) => r.id)

    // Map to store counts
    const counts: Record<string, number> = {}
    routineIds.forEach((id) => (counts[id] = 0))

    if (routineIds.length > 0) {
      // Fetch all routine-exercises for these routines
      // We only need the routine ID from them to count
      const routineExercises = await payload.find({
        collection: 'routine-exercises',
        where: {
          routine: {
            in: routineIds,
          },
        },
        limit: 5000, // Large limit to catch all
        depth: 0,
        select: {
          routine: true,
        },
      })

      // Count them up
      routineExercises.docs.forEach((re) => {
        const rId = typeof re.routine === 'object' ? re.routine.id : re.routine
        if (counts[String(rId)] !== undefined) {
          counts[String(rId)]++
        }
      })
    }

    // 3. Construct response
    const results = routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      description: routine.notes || '-',
      exerciseCount: counts[String(routine.id)] || 0,
      duration: '-',
      lastPerformed: '-',
    }))

    return NextResponse.json({ docs: results })
  } catch (error) {
    console.error('Error fetching routines:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
