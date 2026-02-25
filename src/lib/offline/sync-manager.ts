import { offlineDb, type OfflineWorkout, type OfflineBodyweightLog } from './db'

const MAX_RETRIES = 5

/**
 * Single-device, push-only sync manager.
 *
 * Flow:
 *  1. Write to IndexedDB + enqueue in syncQueue
 *  2. When online → process queue sequentially
 *  3. On success → delete queue entry (record stays as local cache)
 *  4. On failure → increment retryCount, stop after MAX_RETRIES
 */
export class SyncManager {
  private processing = false

  // ── Enqueue helpers ─────────────────────────────────────────────

  /** Save a completed workout locally and enqueue for sync */
  async saveWorkoutOffline(workout: OfflineWorkout): Promise<void> {
    await offlineDb.workouts.put(workout)
    await offlineDb.syncQueue.add({
      type: 'workout',
      refId: workout.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    })
  }

  /** Save a bodyweight log locally and enqueue for sync */
  async saveBodyweightOffline(log: OfflineBodyweightLog): Promise<void> {
    await offlineDb.bodyweightLogs.put(log)
    await offlineDb.syncQueue.add({
      type: 'bodyweight',
      refId: log.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    })
  }

  // ── Queue processing ───────────────────────────────────────────

  /** Process all pending items in order. Returns counts. */
  async processQueue(): Promise<{ synced: number; failed: number }> {
    if (this.processing) return { synced: 0, failed: 0 }
    if (typeof navigator !== 'undefined' && !navigator.onLine) return { synced: 0, failed: 0 }

    this.processing = true
    let synced = 0
    let failed = 0

    try {
      const pending = await offlineDb.syncQueue
        .where('status')
        .equals('pending')
        .sortBy('createdAt')

      for (const item of pending) {
        try {
          await this.pushItem(item.type, item.refId)

          // Mark synced and remove from queue
          await offlineDb.syncQueue.delete(item.id!)
          synced++
        } catch (err) {
          console.error(`[Sync] Failed ${item.type} ${item.refId}:`, err)
          failed++

          const nextRetry = item.retryCount + 1
          if (nextRetry >= MAX_RETRIES) {
            // Give up — remove from queue, keep local record
            console.warn(`[Sync] Giving up on ${item.type} ${item.refId} after ${MAX_RETRIES} retries`)
            await offlineDb.syncQueue.delete(item.id!)
          } else {
            await offlineDb.syncQueue.update(item.id!, { retryCount: nextRetry })
          }
        }
      }
    } finally {
      this.processing = false
    }

    return { synced, failed }
  }

  // ── Push a single item to the server ───────────────────────────

  private async pushItem(type: 'workout' | 'bodyweight', refId: string): Promise<void> {
    switch (type) {
      case 'workout': {
        const workout = await offlineDb.workouts.get(refId)
        if (!workout) throw new Error(`Workout ${refId} not found locally`)

        const res = await fetch('/api/custom/workouts/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            routineId: workout.routineId,
            date: workout.date,
            durationSeconds: workout.durationSeconds,
            exercises: workout.exercises,
          }),
        })
        if (!res.ok) throw new Error(`POST /workouts/start failed: ${res.status}`)
        break
      }

      case 'bodyweight': {
        const log = await offlineDb.bodyweightLogs.get(refId)
        if (!log) throw new Error(`Bodyweight log ${refId} not found locally`)

        const res = await fetch('/api/body-weight-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            weight: log.weight,
            unit: log.unit,
            date: log.date,
          }),
        })
        if (!res.ok) throw new Error(`POST /body-weight-logs failed: ${res.status}`)
        break
      }
    }
  }

  // ── Utility ────────────────────────────────────────────────────

  /** Number of items still waiting to sync */
  async getPendingCount(): Promise<number> {
    return offlineDb.syncQueue.where('status').equals('pending').count()
  }
}

export const syncManager = new SyncManager()
