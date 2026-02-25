import Dexie, { type Table } from 'dexie'

// ─── Offline Workout (completed workouts waiting to sync) ─────────
export interface OfflineWorkout {
  id: string
  routineId: string
  date: string
  durationSeconds: number
  exercises: Array<{
    exerciseId: string
    name: string
    sets: Array<{
      weight: string
      reps: string
      setLabel: string
      completed: boolean
    }>
  }>
  createdAt: string
}

// ─── Offline Bodyweight Log ──────────────────────────────────────
export interface OfflineBodyweightLog {
  id: string
  weight: number
  unit: 'kg' | 'lbs'
  date: string
  createdAt: string
}

// ─── Sync Queue (push-only, local → server) ─────────────────────
export interface SyncQueueItem {
  id?: number
  type: 'workout' | 'bodyweight'
  /** ID of the record in the corresponding offline table */
  refId: string
  status: 'pending' | 'synced'
  createdAt: string
  retryCount: number
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
  }
}

export const offlineDb = new FitLedgerOfflineDB()
