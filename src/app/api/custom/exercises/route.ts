import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { formatServerTimingHeader } from '@/lib/timing'

const EQUIPMENT_VALUES = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'smith_machine',
  'bodyweight',
] as const

type EquipmentValue = (typeof EQUIPMENT_VALUES)[number]

const toEquipmentValue = (value: unknown): EquipmentValue | undefined => {
  if (typeof value !== 'string' || value.length === 0) return undefined
  return (EQUIPMENT_VALUES as readonly string[]).includes(value)
    ? (value as EquipmentValue)
    : undefined
}

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()

  // Authenticate user
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, muscleGroupId, equipment, isCustom } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 })
    }
    if (!muscleGroupId) {
      return NextResponse.json({ error: 'Muscle group is required' }, { status: 400 })
    }

    // Create exercise bypassing admin-only access control
    const exercise = await payload.create({
      collection: 'exercises',
      data: {
        name: name.trim(),
        muscleGroup: Number(muscleGroupId),
        equipment: toEquipmentValue(equipment),
        isCustom: isCustom !== false, // default true
        createdBy: user.id,
      },
      overrideAccess: true,
    })

    const bodyPart =
      typeof exercise.muscleGroup === 'object' && exercise.muscleGroup !== null
        ? (exercise.muscleGroup as { name: string }).name
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

  // Authenticate – needed to filter private exercises
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payloadStart = performance.now()
    const exercisesResponse = await payload.find({
      collection: 'exercises',
      limit: 1000,
      depth: 1,
      select: {
        id: true,
        name: true,
        muscleGroup: true,
        equipment: true,
      },
      sort: 'name',
      where: {
        or: [
          { isCustom: { equals: false } },
          {
            and: [{ isCustom: { equals: true } }, { createdBy: { equals: user.id } }],
          },
        ],
      },
      overrideAccess: true,
    })
    const payloadDuration = performance.now() - payloadStart

    // Map to minimal structure
    const exercises = exercisesResponse.docs.map((ex) => ({
      id: ex.id,
      name: ex.name,
      bodyPart: typeof ex.muscleGroup === 'object' ? ex.muscleGroup.name : 'Other',
      equipment: typeof ex.equipment === 'string' ? ex.equipment : undefined,
    }))

    const totalDuration = performance.now() - routeStart

    console.log(`[API] /api/custom/exercises`)
    console.log(`Payload duration: ${payloadDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`)

    return NextResponse.json(
      { docs: exercises },
      {
        headers: {
          'Cache-Control': 'private, no-store',
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
