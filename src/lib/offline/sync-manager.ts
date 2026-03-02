import { offlineDb, type OfflineWorkout, type OfflineBodyweightLog } from './db'

const MAX_RETRIES = 5

/**
 * Single-device, push-only sync manager.
 *
 * Flow:
 *  1. Write to IndexedDB + enqueue in syncQueue
 *  2. Attempt to process queue (regardless of navigator.onLine)
 *  3. On success → mark synced, delete queue entry
 *  4. On failure → increment retryCount, set status='failed' after MAX_RETRIES
 *
 * Idempotency: Each record's UUID is sent as `clientId` to the server.
 * The server rejects duplicates, making re-pushes safe.
 */
export class SyncManager {
  private processing = false

  // ── Enqueue helpers ─────────────────────────────────────────────

  /** Save a completed workout locally and enqueue for sync */
  async saveWorkoutOffline(workout: OfflineWorkout): Promise<void> {
    await offlineDb.workouts.put({ ...workout, syncStatus: 'pending' })
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
    await offlineDb.bodyweightLogs.put({ ...log, syncStatus: 'pending' })
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
    // Mutex — prevents concurrent runs from rapid triggers or multi-tab
    if (this.processing) return { synced: 0, failed: 0 }

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

          // Mark the record as synced
          if (item.type === 'workout') {
            await offlineDb.workouts.update(item.refId, { syncStatus: 'synced' })
          } else if (item.type === 'bodyweight') {
            await offlineDb.bodyweightLogs.update(item.refId, { syncStatus: 'synced' })
          }

          // Remove from sync queue
          await offlineDb.syncQueue.delete(item.id!)
          synced++
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          console.error(`[Sync] Failed ${item.type} ${item.refId}:`, err)
          failed++

          // Network error → device is offline, stop processing entirely
          // Don't increment retryCount for network failures (not the server's fault)
          if (
            err instanceof TypeError &&
            (errorMessage.includes('Failed to fetch') ||
              errorMessage.includes('NetworkError') ||
              errorMessage.includes('ERR_INTERNET_DISCONNECTED'))
          ) {
            console.warn('[Sync] Network unavailable — stopping queue, will retry when online')
            break
          }

          const nextRetry = item.retryCount + 1

          // 401/403 → session expired, stop processing entirely
          if (errorMessage.includes('401') || errorMessage.includes('403')) {
            console.warn('[Sync] Auth error — stopping queue processing')
            await offlineDb.syncQueue.update(item.id!, {
              retryCount: nextRetry,
              lastError: 'Session expired — please log in again',
            })
            break
          }

          if (nextRetry >= MAX_RETRIES) {
            // Max retries reached — mark as failed (keep in queue for manual retry)
            console.warn(
              `[Sync] Giving up on ${item.type} ${item.refId} after ${MAX_RETRIES} retries`,
            )
            await offlineDb.syncQueue.update(item.id!, {
              status: 'failed',
              retryCount: nextRetry,
              lastError: errorMessage,
            })

            // Mark the record itself as failed
            if (item.type === 'workout') {
              await offlineDb.workouts.update(item.refId, { syncStatus: 'failed' })
            } else if (item.type === 'bodyweight') {
              await offlineDb.bodyweightLogs.update(item.refId, { syncStatus: 'failed' })
            }
          } else {
            await offlineDb.syncQueue.update(item.id!, {
              retryCount: nextRetry,
              lastError: errorMessage,
            })
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
            clientId: workout.id, // UUID for idempotency
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
            loggedAt: log.date, // Payload field is `loggedAt`, not `date`
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

  /** Number of items that permanently failed */
  async getFailedCount(): Promise<number> {
    return offlineDb.syncQueue.where('status').equals('failed').count()
  }

  /** Reset failed items to pending for manual retry */
  async retryFailed(): Promise<void> {
    const failed = await offlineDb.syncQueue.where('status').equals('failed').toArray()
    for (const item of failed) {
      await offlineDb.syncQueue.update(item.id!, {
        status: 'pending',
        retryCount: 0,
        lastError: undefined,
      })
      // Reset the record's syncStatus too
      if (item.type === 'workout') {
        await offlineDb.workouts.update(item.refId, { syncStatus: 'pending' })
      } else if (item.type === 'bodyweight') {
        await offlineDb.bodyweightLogs.update(item.refId, { syncStatus: 'pending' })
      }
    }
  }
}

export const syncManager = new SyncManager()
