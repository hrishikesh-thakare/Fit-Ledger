import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const page = Number(req.nextUrl.searchParams.get('page')) || 1
  const limit = 50 // Process in smaller batches due to complexity

  try {
    const workoutDays = await payload.find({
      collection: 'workout-days',
      limit,
      page,
      sort: '-date',
      depth: 0,
    })

    if (workoutDays.docs.length === 0) {
      return NextResponse.json({ message: 'No more records', completed: true })
    }

    const results = []

    for (const day of workoutDays.docs) {
      // 1. Fetch related exercises (to count)
      const exercises = await payload.find({
        collection: 'workout-exercises',
        where: { workoutDay: { equals: day.id } },
        limit: 1000,
        depth: 0,
      })

      const exerciseCount = exercises.totalDocs

      // 2. Fetch related sets (to sum volume)
      // Note: workout-sets are linked to workoutDay directly as well
      const sets = await payload.find({
        collection: 'workout-sets',
        where: { workoutDay: { equals: day.id } },
        limit: 5000,
        depth: 0,
      })

      let volumeKg = 0
      sets.docs.forEach((set) => {
        volumeKg += (Number(set.weight) || 0) * (Number(set.reps) || 0)
      })

      // 3. Update WorkoutDay
      await payload.update({
        collection: 'workout-days',
        id: day.id,
        data: {
          exerciseCount,
          volumeKg,
        },
      })

      results.push({ id: day.id, exerciseCount, volumeKg })
    }

    return NextResponse.json({
      message: `Processed ${results.length} records on page ${page}`,
      nextPage: workoutDays.hasNextPage ? page + 1 : null,
      completed: !workoutDays.hasNextPage,
      results,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}
