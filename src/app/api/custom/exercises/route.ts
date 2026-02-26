import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { formatServerTimingHeader } from '@/lib/timing'

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()

  // Authenticate user
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, muscleGroupId, equipment } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 })
    }
    if (!muscleGroupId) {
      return NextResponse.json({ error: 'Muscle group is required' }, { status: 400 })
    }

    // Create exercise bypassing admin-only access control; mark as custom
    const exercise = await payload.create({
      collection: 'exercises',
      data: {
        name: name.trim(),
        muscleGroup: Number(muscleGroupId),
        equipment: Array.isArray(equipment) && equipment.length > 0 ? equipment : undefined,
        isCustom: true,
      },
      overrideAccess: true,
    })

    const bodyPart =
      typeof exercise.muscleGroup === 'object' && exercise.muscleGroup !== null
        ? (exercise.muscleGroup as any).name
        : 'Other'

    return NextResponse.json(
      { doc: { id: String(exercise.id), name: exercise.name, bodyPart } },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating custom exercise:', error)
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 })
  }
}

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
        equipment: true,
      },
      sort: 'name',
    })
    const payloadDuration = performance.now() - payloadStart

    // Map to minimal structure
    const exercises = exercisesResponse.docs.map((ex) => ({
      id: ex.id,
      name: ex.name,
      bodyPart: typeof ex.muscleGroup === 'object' ? ex.muscleGroup.name : 'Other',
      equipment: Array.isArray(ex.equipment) ? ex.equipment : [],
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
