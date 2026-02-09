import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
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

    // Map to minimal structure
    const exercises = exercisesResponse.docs.map((ex) => ({
      id: ex.id,
      name: ex.name,
      bodyPart: typeof ex.muscleGroup === 'object' ? ex.muscleGroup.name : 'Other',
    }))

    return NextResponse.json(
      { docs: exercises },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
