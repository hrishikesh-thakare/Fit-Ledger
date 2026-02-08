import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  // Cast userId to number
  const numericUserId = Number(userId)

  const payload = await getPayload({ config })

  try {
    // 1. Fetch Workout Days
    const workoutDaysResponse = await payload.find({
      collection: 'workout-days',
      where: {
        user: {
          equals: numericUserId,
        },
      },
      sort: '-date',
      limit: 100,
      depth: 0,
    })

    const workoutDays = workoutDaysResponse.docs

    if (workoutDays.length === 0) {
      return NextResponse.json({ docs: [] })
    }

    const workoutDayIds = workoutDays.map((d) => d.id)

    // 2. Fetch all related data
    // We need exercise counts and volume (sum of weight * reps)

    // Fetch Workout Exercises (for count)
    const workoutExercisesResponse = await payload.find({
      collection: 'workout-exercises',
      where: {
        workoutDay: {
          in: workoutDayIds,
        },
      },
      limit: 5000,
      depth: 0,
      select: {
        workoutDay: true,
      },
    })

    // Fetch Workout Sets (for volume)
    // Note: workout-sets also link to workoutDay?
    // Let's check schema/previous usage.
    // In `history/page.tsx`: `/workout-sets?where[workoutDay][equals]=${workout.id}`.
    // So yes, sets link to workoutDay directly.
    const workoutSetsResponse = await payload.find({
      collection: 'workout-sets',
      where: {
        workoutDay: {
          in: workoutDayIds,
        },
      },
      limit: 10000, // Large limit for sets
      depth: 0,
      select: {
        workoutDay: true,
        weight: true,
        reps: true,
      },
    })

    // 3. Aggegrate in memory
    const counts: Record<string, number> = {}
    const volumes: Record<string, number> = {} // In KG

    // Initialize
    workoutDayIds.forEach((id) => {
      counts[id] = 0
      volumes[id] = 0
    })

    // Count exercises
    workoutExercisesResponse.docs.forEach((we) => {
      const wId = typeof we.workoutDay === 'object' ? we.workoutDay.id : we.workoutDay
      if (counts[String(wId)] !== undefined) {
        counts[String(wId)]++
      }
    })

    // Sum volume
    workoutSetsResponse.docs.forEach((set) => {
      const wId = typeof set.workoutDay === 'object' ? set.workoutDay.id : set.workoutDay
      if (volumes[String(wId)] !== undefined) {
        const weight = set.weight || 0
        const reps = set.reps || 0
        volumes[String(wId)] += weight * reps
      }
    })

    // 4. Transform to response format
    // Frontend expects:
    // id, name, date, time, duration, volume (string), exercises (count)
    // I will return raw values where possible to let frontend format,
    // BUT to minimize frontend changes I'll try to match closely,
    // except for Volume which I'll return as raw number `volumeKg` so frontend can format it with unit.

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
        dateRaw: day.date, // Pass raw date for formatting
        duration: durationStr,
        volumeKg: volumes[String(day.id)] || 0,
        exercises: counts[String(day.id)] || 0,
      }
    })

    return NextResponse.json({ docs: results })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
