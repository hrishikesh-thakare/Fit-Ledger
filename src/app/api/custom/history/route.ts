import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 30

import { formatServerTimingHeader } from '@/lib/timing'

export async function GET(req: NextRequest) {
  const routeStart = performance.now()
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  // Cast userId to number
  const numericUserId = Number(userId)

  const payload = await getPayloadClient()

  try {
    const payloadStart = performance.now()
    // 1. Fetch Workout Days
    // Optimized: Select denormalized fields directly. No related queries.
    const where: Record<string, unknown> = {
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
      const durationSeconds = day.durationSeconds || 0
      const hours = Math.floor(durationSeconds / 3600)
      const minutes = Math.floor((durationSeconds % 3600) / 60)
      const seconds = durationSeconds % 60
      const durationStr =
        hours > 0
          ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

      return {
        id: day.id,
        name: day.title || 'Workout',
        dateRaw: day.date,
        duration: durationStr,
        volumeKg: day.volumeKg || 0,
        exercises: day.exerciseCount || 0,
      }
    })

    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/history`)
    console.log(`Payload duration: ${payloadDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`)

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
