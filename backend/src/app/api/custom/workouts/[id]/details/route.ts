import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import type { WorkoutSet } from '@/payload-types'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: workoutId } = await params

  try {
    // 1 & 2. Fetch Workout Day and Exercises in parallel
    const [workoutDay, workoutExercisesResponse] = await Promise.all([
      payload.findByID({
        collection: 'workout-days',
        id: workoutId,
        depth: 0,
        overrideAccess: false,
        user,
      }),
      payload.find({
        collection: 'workout-exercises',
        where: {
          workoutDay: {
            equals: workoutId,
          },
        },
        depth: 1,
        sort: 'exerciseOrder',
        limit: 100,
        overrideAccess: false,
        user,
      })
    ])

    const exerciseIds = workoutExercisesResponse.docs.map((doc) => doc.id)

    // 3. Fetch Workout Sets
    let workoutSetsDocs: WorkoutSet[] = []
    if (exerciseIds.length > 0) {
      const workoutSetsResponse = await payload.find({
        collection: 'workout-sets',
        where: {
          workoutExercise: {
            in: exerciseIds,
          },
        },
        depth: 0,
        sort: 'setOrder',
        limit: 500,
        overrideAccess: false,
        user,
      })
      workoutSetsDocs = workoutSetsResponse.docs
    }

    return NextResponse.json({
      workoutDay,
      workoutExercises: workoutExercisesResponse.docs,
      workoutSets: workoutSetsDocs,
    })
  } catch (error) {
    console.error('Error fetching workout details:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
