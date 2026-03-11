'use client'

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react'
import { syncManager } from '@/lib/offline/sync-manager'
import { preCacheData } from '@/lib/offline/cache-manager'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { useAuth } from '@/contexts/AuthContext'
import { type OfflineWorkout, type OfflineBodyweightLog } from '@/lib/offline/db'

// ─── Types ────────────────────────────────────────────────────────
interface BackgroundSyncState {
  isSaving: boolean
  pendingCount: number
  failedCount: number
}

interface BackgroundSyncContextType extends BackgroundSyncState {
  saveWorkoutLocally: (draft: {
    routineId: string
    date: string
    durationSeconds: number
    updateRoutineWeights?: boolean
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
  }) => Promise<string>
  saveBodyweightLocally: (log: {
    weight: number
    unit: 'kg' | 'lbs'
    date: string
  }) => Promise<string>
  triggerSync: () => void
  retryFailed: () => void
}

// ─── Context ──────────────────────────────────────────────────────
const BackgroundSyncContext = createContext<BackgroundSyncContextType | undefined>(undefined)

// ─── Sync interval (60 seconds) ──────────────────────────────────
const SYNC_INTERVAL_MS = 60_000

// ─── Provider ─────────────────────────────────────────────────────
export function BackgroundSyncProvider({ children }: { children: ReactNode }) {
  const [isSaving, setIsSaving] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const isSavingRef = useRef(false)

  const { showSnackbar } = useSnackbar()
  const { user } = useAuth()

  // ── Refs to avoid stale closures in long-lived effects ─────────
  const showSnackbarRef = useRef(showSnackbar)
  const userIdRef = useRef(user?.id)
  useEffect(() => { showSnackbarRef.current = showSnackbar }, [showSnackbar])
  useEffect(() => { userIdRef.current = user?.id }, [user?.id])

  // ── Refresh counts from IndexedDB ──────────────────────────────
  const refreshCounts = useCallback(async () => {
    try {
      const [pending, failed] = await Promise.all([
        syncManager.getPendingCount(),
        syncManager.getFailedCount(),
      ])
      setPendingCount(pending)
      setFailedCount(failed)
    } catch {
      // IndexedDB may not be available during SSR
    }
  }, [])

  // ── Process sync queue and update counts ───────────────────────
  // Using a stable ref-based approach to avoid unstable deps in useEffect
  const doSync = useCallback(async () => {
    // Skip sync attempt if clearly offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await refreshCounts()
      return
    }

    try {
      const result = await syncManager.processQueue()

      if (result.synced > 0) {
        showSnackbarRef.current({
          message: `${result.synced} item${result.synced > 1 ? 's' : ''} synced`,
          severity: 'success',
          duration: 3000,
        })
      }

      if (result.failed > 0) {
        showSnackbarRef.current({
          message: `${result.failed} item${result.failed > 1 ? 's' : ''} failed to sync`,
          severity: 'warning',
          duration: 5000,
        })
      }

      await refreshCounts()
    } catch (err) {
      console.error('[BackgroundSync] processQueue error:', err)
    }
  }, [refreshCounts]) // stable deps only — no showSnackbar here

  // ── Public trigger ─────────────────────────────────────────────
  const triggerSync = useCallback(() => {
    void doSync()
  }, [doSync])

  // ── Sync triggers: mount, online, focus, interval ──────────────
  useEffect(() => {
    // 1. On mount: pre-cache + initial sync
    void (async () => {
      await preCacheData(userIdRef.current)
      await doSync()
    })()

    // 2. On network reconnect
    const handleOnline = () => {
      console.log('[BackgroundSync] Online — triggering sync')
      void doSync()
      void preCacheData(userIdRef.current)
    }

    // 3. On tab regain focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void doSync()
      }
    }

    // 4. On custom back-online event (from useOnlineStatus)
    const handleBackOnline = () => {
      console.log('[BackgroundSync] fitledger:back-online — triggering sync')
      void doSync()
      void preCacheData(userIdRef.current)
    }

    // 5. Interval timer
    const intervalId = setInterval(() => {
      void doSync()
    }, SYNC_INTERVAL_MS)

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('fitledger:back-online', handleBackOnline)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('fitledger:back-online', handleBackOnline)
    }
  }, [doSync])

  // ── Save workout locally ───────────────────────────────────────
  const saveWorkoutLocally = useCallback(
    async (draft: {
      routineId: string
      date: string
      durationSeconds: number
      updateRoutineWeights?: boolean
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
    }): Promise<string> => {
      if (isSavingRef.current) {
        console.warn('[BackgroundSync] Save already in progress, skipping')
        throw new Error('Save already in progress')
      }

      isSavingRef.current = true
      setIsSaving(true)

      try {
        const offlineId = crypto.randomUUID()
        const workout: OfflineWorkout = {
          id: offlineId,
          routineId: draft.routineId,
          date: draft.date,
          durationSeconds: draft.durationSeconds,
          updateRoutineWeights: draft.updateRoutineWeights ?? true,
          exercises: draft.exercises,
          createdAt: new Date().toISOString(),
          syncStatus: 'pending',
        }

        // 1. Save to IndexedDB + enqueue
        await syncManager.saveWorkoutOffline(workout)

        showSnackbarRef.current({
          message: 'Workout saved — syncing in background',
          severity: 'info',
          duration: 3000,
        })

        // 2. Attempt immediate sync (non-blocking)
        void doSync()

        await refreshCounts()

        return offlineId
      } finally {
        setIsSaving(false)
        isSavingRef.current = false
      }
    },
    [doSync, refreshCounts],
  )

  // ── Save bodyweight locally ────────────────────────────────────
  const saveBodyweightLocally = useCallback(
    async (draft: { weight: number; unit: 'kg' | 'lbs'; date: string }): Promise<string> => {
      const offlineId = crypto.randomUUID()
      const log: OfflineBodyweightLog = {
        id: offlineId,
        weight: draft.weight,
        unit: draft.unit,
        date: draft.date,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
      }

      await syncManager.saveBodyweightOffline(log)

      // Attempt immediate sync (non-blocking)
      void doSync()

      await refreshCounts()

      return offlineId
    },
    [doSync, refreshCounts],
  )

  // ── Retry failed items ─────────────────────────────────────────
  const retryFailed = useCallback(async () => {
    await syncManager.retryFailed()
    showSnackbarRef.current({ message: 'Retrying failed items...', severity: 'info', duration: 3000 })
    void doSync()
  }, [doSync])

  return (
    <BackgroundSyncContext.Provider
      value={{
        isSaving,
        pendingCount,
        failedCount,
        saveWorkoutLocally,
        saveBodyweightLocally,
        triggerSync,
        retryFailed,
      }}
    >
      {children}
    </BackgroundSyncContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useBackgroundSync() {
  const context = useContext(BackgroundSyncContext)
  if (!context) {
    throw new Error('useBackgroundSync must be used within BackgroundSyncProvider')
  }
  return context
}
