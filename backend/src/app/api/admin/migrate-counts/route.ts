import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()

  try {
    // 1. Fetch all routines that need processing
    // In a real migration, we might process in chunks using cursor pagination
    // For now, let's fetch all 100 at a time
    const batchSize = 100
    const page = Number(req.nextUrl.searchParams.get('page')) || 1

    const routines = await payload.find({
      collection: 'routines',
      limit: batchSize,
      page,
      depth: 0,
    })

    if (routines.docs.length === 0) {
      return NextResponse.json({ message: 'No more routines to process', completed: true })
    }

    const updates = []

    for (const routine of routines.docs) {
      // Fetch exact counts
      const exercises = await payload.find({
        collection: 'routine-exercises',
        where: { routine: { equals: routine.id } },
        limit: 500, // Reasonable max per routine
        depth: 0,
      })

      const exerciseCount = exercises.totalDocs

      let setCount = 0
      if (exerciseCount > 0) {
        const reIds = exercises.docs.map((re) => re.id)
        const sets = await payload.find({
          collection: 'routine-sets',
          where: { routineExercise: { in: reIds } },
          limit: 2000,
          depth: 0,
        })
        setCount = sets.totalDocs
      }

      // Perform Update
      updates.push(
        payload.update({
          collection: 'routines',
          id: routine.id,
          data: {
            exerciseCount,
            setCount,
          },
        }),
      )
    }

    await Promise.all(updates)

    return NextResponse.json({
      message: `Processed ${updates.length} routines on page ${page}`,
      nextPage: routines.hasNextPage ? page + 1 : null,
      completed: !routines.hasNextPage,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}
