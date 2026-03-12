import Dexie, { type Table } from 'dexie'

// ─── Sync status for mutable entities ──────────────────────────────
export type SyncStatus = 'synced' | 'pending' | 'failed'

// ─── Offline Workout (completed workouts waiting to sync) ─────────
export interface OfflineWorkout {
  id: string // Client-generated UUID (also used as clientId for idempotency)
  routineId: string
  date: string
  durationSeconds: number
  updatePrevWeights?: boolean
  exercises: Array<{
    exerciseId: string
    name: string
    sets: Array<{
      weight: string
      reps: string
      setLabel: string
      completed: boolean
      setOrder?: number
    }>
  }>
  createdAt: string
  syncStatus: SyncStatus
}

// ─── Offline Bodyweight Log ──────────────────────────────────────
export interface OfflineBodyweightLog {
  id: string // Client-generated UUID (also used as clientId for idempotency)
  weight: number
  unit: 'kg' | 'lbs'
  date: string
  createdAt: string
  syncStatus: SyncStatus
}

// ─── Sync Queue (push-only, local → server) ─────────────────────
export interface SyncQueueItem {
  id?: number
  type: 'workout' | 'bodyweight'
  /** ID of the record in the corresponding offline table */
  refId: string
  status: 'pending' | 'synced' | 'failed'
  createdAt: string
  retryCount: number
  lastError?: string
}

// ─── Cached read-only data ──────────────────────────────────────
export interface CachedExercise {
  id: string
  name: string
  muscleGroupId: string
  muscleGroupName: string
  equipment?: string
  cachedAt: string
}

export interface CachedRoutine {
  id: string
  name: string
  description?: string
  exerciseCount?: number
  duration?: string
  previewExercises?: string[]
  muscleGroups?: string[]
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    sets: Array<{ type: string; reps: string; weight: string }>
    order: number
  }>
  cachedAt: string
}

// ─── Database ───────────────────────────────────────────────────
class FitLedgerOfflineDB extends Dexie {
  workouts!: Table<OfflineWorkout, string>
  bodyweightLogs!: Table<OfflineBodyweightLog, string>
  syncQueue!: Table<SyncQueueItem, number>
  exercises!: Table<CachedExercise, string>
  routines!: Table<CachedRoutine, string>

  constructor() {
    super('FitLedgerOffline')

    this.version(1).stores({
      workouts: 'id, routineId, date',
      bodyweightLogs: 'id, date',
      syncQueue: '++id, type, refId, status, createdAt',
      exercises: 'id, name, muscleGroupId',
      routines: 'id, name',
    })

    // V2: Add syncStatus index to mutable entities, add failed status to syncQueue
    this.version(2)
      .stores({
        workouts: 'id, routineId, date, syncStatus',
        bodyweightLogs: 'id, date, syncStatus',
        syncQueue: '++id, type, refId, status, createdAt',
        exercises: 'id, name, muscleGroupId',
        routines: 'id, name',
      })
      .upgrade((tx) => {
        // Existing records are assumed to be synced (they were created via direct API calls)
        tx.table('workouts')
          .toCollection()
          .modify((w: OfflineWorkout) => {
            if (!w.syncStatus) w.syncStatus = 'synced'
          })
        tx.table('bodyweightLogs')
          .toCollection()
          .modify((l: OfflineBodyweightLog) => {
            if (!l.syncStatus) l.syncStatus = 'synced'
          })
      })
  }
}

export const offlineDb = new FitLedgerOfflineDB()
