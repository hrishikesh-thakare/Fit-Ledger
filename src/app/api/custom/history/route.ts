import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { toKg, fromKg } from '@/lib/utils/weightConversion' // Wait, I can't import this easily if it depends on client stuff?
// checking usage of weight conversion. It's a util. I'll check its content first or just implement logic here.
// Actually I'll implement logic here to avoid importing frontend-specific code if it uses hooks.
// Assuming simple math for now: logic was `fromKg(totalVolumeKg, userUnit)`.
// The DB stores weight in... wait, `WorkoutSets` has `weight`. Is it always KG?
// In `routines/[id]/edit/page.tsx`, it says `weight: set.weight ? formatWeight(parseFloat(set.weight), userUnit) : set.weight`.
// In `history/page.tsx`, it calculates volume: `sum + (set.weight || 0) * (set.reps || 0)` and implies this is `totalVolumeKg`.
// So DB stores KG.
// I will return the volume in KG, and let the frontend convert it to user preference.
// Or I can accept `unit` param.
// The frontend `history/page.tsx` fetches `userProfile` to get `preferredUnit`.
// I can accept `preferredUnit` as query param to do it server side, or just return KG and let frontend convert.
// Returning KG is cleaner API design (standardized unit). Frontend already has conversion utils.
// BUT, the frontend `history/page.tsx` expects `volume` as a string like "20,000 kg".
// If I change the API to return raw number `volumeKg`, I need to update frontend.
// I'll stick to returning `volume` string if I can, OR return `volumeKg` number and update frontend.
// Updating frontend is better.
// Let's check `src/lib/utils/weightConversion.ts` content first to be safe.

import { WorkoutDay, WorkoutExercise, WorkoutSet } from '@/payload-types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  try {
    // 1. Fetch Workout Days
    const workoutDaysResponse = await payload.find({
      collection: 'workout-days',
      where: {
        user: {
          equals: userId,
        },
      },
      sort: '-date',
      limit: 100,
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

      const workoutDate = new Date(day.date)
      // Format date/time helper? I'll just return raw ISO and let frontend format
      // Wait, existing frontend expects `date` and `time` strings.
      // `date: dateStr` (ISO split T), `time: timeStr` (toLocaleTimeString).
      // I can return these strings to keep frontend simple.
      // But `toLocaleTimeString` on server might be different locale (UTC vs user).
      // BETTER: Return `date` as ISO string, and let frontend format it.
      // `history/page.tsx` does `new Date(workout.date)`.
      // `workout.date` from Payload is ISO string.
      // The `rawWorkouts` state in frontend has `date` as string (split T).
      // I will return the props expected by `WorkoutHistoryItem` but maybe updated.

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
