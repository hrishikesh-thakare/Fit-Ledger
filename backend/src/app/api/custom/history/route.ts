import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import type { Where } from 'payload'

export const dynamic = 'force-dynamic'

import { formatServerTimingHeader } from '@/lib/timing'

export async function GET(req: NextRequest) {
  const routeStart = performance.now()
  const searchParams = req.nextUrl.searchParams
  const payload = await getPayloadClient()

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = searchParams.get('userId') || user.id
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (user.role !== 'admin' && String(user.id) !== String(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Cast userId to number
  const numericUserId = Number(userId)

  try {
    const payloadStart = performance.now()
    // 1. Fetch Workout Days
    // Optimized: Select denormalized fields directly. No related queries.
    const where: Where = {
      user: {
        equals: numericUserId,
      },
    }

    if (startDate && endDate) {
      where.date = {
        greater_than_equal: startDate,
        less_than_equal: endDate,
      }
    }

    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100
    // Cap limit to prevent abuse
    const safeLimit = Math.min(Math.max(limit, 1), 1000)

    const workoutDaysResponse = await payload.find({
      collection: 'workout-days',
      where,
      sort: '-date',
      limit: safeLimit,
      depth: 0,
      overrideAccess: true,
      select: {
        id: true,
        title: true,
        date: true,
        durationSeconds: true,
        volumeKg: true,
        exerciseCount: true,
      },
    })

    const workoutDays = workoutDaysResponse.docs
    const payloadDuration = performance.now() - payloadStart

    // 2. Transform to response format
    const results = workoutDays.map((day) => {
      return {
        id: day.id,
        name: day.title || 'Workout',
        date: day.date,
        durationSeconds: day.durationSeconds || 0,
        volumeKg: day.volumeKg || 0,
        exercises: day.exerciseCount || 0,
      }
    })

    const totalDuration = performance.now() - routeStart



    return NextResponse.json(
      { docs: results },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=120, stale-while-revalidate=300',
          'Server-Timing': formatServerTimingHeader({
            total: totalDuration,
            payload: payloadDuration,
          }),
        },
      },
    )
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
