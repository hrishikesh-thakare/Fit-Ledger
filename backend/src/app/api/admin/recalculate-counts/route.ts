import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { routineId } = await req.json()

  if (!routineId) {
    return NextResponse.json({ error: 'Routine ID required' }, { status: 400 })
  }

  try {
    // 1. Fetch exact counts
    const exercises = await payload.find({
      collection: 'routine-exercises',
      where: { routine: { equals: Number(routineId) } },
      limit: 500,
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

    // 2. Update Routine
    await payload.update({
      collection: 'routines',
      id: Number(routineId),
      data: {
        exerciseCount,
        setCount,
      },
    })

    return NextResponse.json({
      success: true,
      routineId,
      newCounts: { exerciseCount, setCount },
    })
  } catch (error) {
    console.error('Recalculation error:', error)
    return NextResponse.json({ error: 'Recalculation failed' }, { status: 500 })
  }
}
