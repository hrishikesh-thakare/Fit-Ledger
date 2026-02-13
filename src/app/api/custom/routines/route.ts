import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 30

import { formatServerTimingHeader } from '@/lib/timing'

export async function GET(req: NextRequest) {
  const routeStart = performance.now()

  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')
    console.log(
      '[DEBUG] GET /api/custom/routines - userId:',
      userId,
      'searchParams:',
      searchParams.toString(),
    )

    if (!userId) {
      return NextResponse.json({ errors: [{ message: 'User ID is required' }] }, { status: 400 })
    }

    // Cast ID to number
    const numericUserId = Number(userId)
    if (isNaN(numericUserId)) {
      return NextResponse.json({ errors: [{ message: 'Invalid User ID' }] }, { status: 400 })
    }

    const payload = await getPayloadClient()

    const payloadStart = performance.now()
    // 1. Fetch all active routines for this user
    // Optimized: Select only needed fields, depth 0. Now using denormalized counts.
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
        exerciseCount: true,
        setCount: true,
      },
    })

    const payloadDuration = performance.now() - payloadStart

    const routines = routinesResponse.docs

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

    // 2. Construct response using stored counts
    const results = routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      description: routine.notes || '',
      notes: routine.notes || null,
      exerciseCount: routine.exerciseCount || 0,
      duration: formatDuration((routine.setCount || 0) as number),
      lastPerformed: '-', // Placeholder as per logic
    }))

    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/routines`)
    console.log(`Payload duration: ${payloadDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`)

    return NextResponse.json(
      { docs: results },
      {
        headers: {
          // Short cache for user-specific data - 10s cache, revalidate in background
          'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
          'Server-Timing': formatServerTimingHeader({
            total: totalDuration,
            payload: payloadDuration,
          }),
        },
      },
    )
  } catch (error: any) {
    console.error('Error fetching routines:', error)
    // Return a JSON error response even for crashes
    return NextResponse.json(
      {
        errors: [
          {
            message: error?.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
          },
        ],
      },
      { status: 500 },
    )
  }
}
