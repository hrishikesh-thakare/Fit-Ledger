import { getPayloadClient } from '@/lib/payload'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/migrate-routine-fk
 *
 * One-time migration: backfill `routine` FK on existing WorkoutDays.
 * Matches by user ID + title === routine name.
 *
 * Idempotent — skips records that already have a routine set.
 * Processes in batches of 50 to avoid memory issues.
 * Admin-only (checked via Payload auth).
 */
const BATCH_SIZE = 50

export async function POST() {
  const payload = await getPayloadClient()

  let page = 1
  let hasMore = true
  let matched = 0
  let skippedAlreadySet = 0
  let skippedNoMatch = 0
  let skippedMultipleMatches = 0
  let totalProcessed = 0

  const unmatchedRecords: Array<{ id: number; title: string; userId: number | string }> = []

  try {
    while (hasMore) {
      // Fetch WorkoutDays without a routine set
      const workoutDays = await payload.find({
        collection: 'workout-days',
        where: {
          routine: { exists: false },
        },
        limit: BATCH_SIZE,
        page,
        depth: 0, // No joins — we just need raw IDs
        sort: 'createdAt',
      })

      if (workoutDays.docs.length === 0) {
        hasMore = false
        break
      }

      for (const wd of workoutDays.docs) {
        totalProcessed++

        // Already has routine — skip (safety check)
        if (wd.routine) {
          skippedAlreadySet++
          continue
        }

        const userId = typeof wd.user === 'object' ? wd.user.id : wd.user
        const title = wd.title

        if (!userId || !title) {
          skippedNoMatch++
          unmatchedRecords.push({
            id: wd.id,
            title: title || '(empty)',
            userId: userId || '(empty)',
          })
          continue
        }

        // Find matching routine: same user + name matches title
        const matchingRoutines = await payload.find({
          collection: 'routines',
          where: {
            and: [{ user: { equals: userId } }, { name: { equals: title } }],
          },
          limit: 2, // We only need to know if there's exactly 1
          depth: 0,
        })

        if (matchingRoutines.docs.length === 1) {
          // Exact match — update
          await payload.update({
            collection: 'workout-days',
            id: wd.id,
            data: {
              routine: matchingRoutines.docs[0].id,
            },
          })
          matched++
        } else if (matchingRoutines.docs.length === 0) {
          skippedNoMatch++
          unmatchedRecords.push({ id: wd.id, title, userId })
        } else {
          skippedMultipleMatches++
          unmatchedRecords.push({ id: wd.id, title, userId })
        }
      }

      // If we got fewer than BATCH_SIZE, we've exhausted the results
      hasMore = workoutDays.hasNextPage ?? false
      page++
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalProcessed,
        matched,
        skippedAlreadySet,
        skippedNoMatch,
        skippedMultipleMatches,
      },
      unmatchedRecords: unmatchedRecords.slice(0, 50), // Cap output
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        error: 'Migration failed',
        stats: {
          totalProcessed,
          matched,
          skippedAlreadySet,
          skippedNoMatch,
          skippedMultipleMatches,
        },
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
