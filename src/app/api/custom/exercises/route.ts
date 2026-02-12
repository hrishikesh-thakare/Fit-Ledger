import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { formatServerTimingHeader } from '@/lib/timing'

export async function GET(req: NextRequest) {
  const routeStart = performance.now()
  const payload = await getPayloadClient()

  try {
    const payloadStart = performance.now()
    // Fetch exercises with minimal fields and depth 0 for performance
    const exercisesResponse = await payload.find({
      collection: 'exercises',
      limit: 1000,
      depth: 1, // Need depth 1 to get muscle group name
      select: {
        id: true,
        name: true,
        muscleGroup: true,
      },
      sort: 'name',
    })
    const payloadDuration = performance.now() - payloadStart

    // Map to minimal structure
    const exercises = exercisesResponse.docs.map((ex) => ({
      id: ex.id,
      name: ex.name,
      bodyPart: typeof ex.muscleGroup === 'object' ? ex.muscleGroup.name : 'Other',
    }))

    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/exercises`)
    console.log(`Payload duration: ${payloadDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`)

    return NextResponse.json(
      { docs: exercises },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Server-Timing': formatServerTimingHeader({
            total: totalDuration,
            payload: payloadDuration,
          }),
        },
      },
    )
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
