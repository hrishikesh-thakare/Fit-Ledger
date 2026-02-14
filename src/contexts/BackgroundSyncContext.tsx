'use client'

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react'
import { Button } from '@mui/material'
import { saveWorkout } from '@/lib/api/workout'
import { useSnackbar } from '@/contexts/SnackbarContext'

// ─── Types ────────────────────────────────────────────────────────
interface SaveWorkoutDraft {
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
}

interface BackgroundSyncState {
  isSaving: boolean
  lastError: string | null
  pendingWorkoutDraft: SaveWorkoutDraft | null
}

interface BackgroundSyncContextType extends BackgroundSyncState {
  startBackgroundSave: (draft: SaveWorkoutDraft) => void
  retryBackgroundSave: () => void
}

// ─── Context ──────────────────────────────────────────────────────
const BackgroundSyncContext = createContext<BackgroundSyncContextType | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────
export function BackgroundSyncProvider({ children }: { children: ReactNode }) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [pendingWorkoutDraft, setPendingWorkoutDraft] = useState<SaveWorkoutDraft | null>(null)

  // Ref to track saving state synchronously (avoids stale closures in async fn)
  const isSavingRef = useRef(false)

  const { showSnackbar } = useSnackbar()

  // ── Background save function (not exported directly) ──────────
  const saveWorkoutInBackground = useCallback(
    async (draft: SaveWorkoutDraft) => {
      try {
        await saveWorkout(draft)

        // ✅ Success — clear draft only after confirmed HTTP 200
        setPendingWorkoutDraft(null)
        setLastError(null)
        setIsSaving(false)
        isSavingRef.current = false

        showSnackbar({
          message: 'Workout saved successfully',
          severity: 'success',
          duration: 3000,
        })
      } catch (err) {
        // ❌ Failure — keep draft for retry
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setLastError(errorMessage)
        setIsSaving(false)
        isSavingRef.current = false
        // pendingWorkoutDraft is NOT cleared — available for retry

        showSnackbar({
          message: 'Save failed. Tap to retry.',
          severity: 'error',
          duration: null, // Persistent — user must dismiss or retry
          action: (
            <Button
              color="inherit"
              size="small"
              sx={{ fontWeight: 700, minWidth: 'auto' }}
              onClick={() => {
                retryBackgroundSave()
              }}
            >
              Retry
            </Button>
          ),
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showSnackbar],
  )

  // ── Start save (fire-and-forget) ──────────────────────────────
  const startBackgroundSave = useCallback(
    (draft: SaveWorkoutDraft) => {
      // Duplicate guard — prevent concurrent saves
      if (isSavingRef.current) {
        console.warn('[BackgroundSync] Save already in progress, skipping')
        return
      }

      // Deep-clone to avoid mutation issues
      const snapshot = structuredClone(draft)

      // Store snapshot for retry
      setPendingWorkoutDraft(snapshot)
      setIsSaving(true)
      setLastError(null)
      isSavingRef.current = true

      // Show persistent "saving" snackbar
      showSnackbar({
        message: 'Saving workout...',
        severity: 'info',
        duration: null, // Persistent — no auto-hide
      })

      // Fire and forget — DO NOT await
      void saveWorkoutInBackground(snapshot)
    },
    [saveWorkoutInBackground, showSnackbar],
  )

  // ── Retry ─────────────────────────────────────────────────────
  const retryBackgroundSave = useCallback(() => {
    // Use functional state getter to avoid stale closure
    setPendingWorkoutDraft((currentDraft) => {
      if (!currentDraft) {
        console.warn('[BackgroundSync] No pending draft to retry')
        return currentDraft
      }

      if (isSavingRef.current) {
        console.warn('[BackgroundSync] Save already in progress, skipping retry')
        return currentDraft
      }

      // Re-trigger save with existing draft
      setIsSaving(true)
      setLastError(null)
      isSavingRef.current = true

      showSnackbar({
        message: 'Retrying save...',
        severity: 'info',
        duration: null,
      })

      void saveWorkoutInBackground(currentDraft)

      return currentDraft // Keep draft until success
    })
  }, [saveWorkoutInBackground, showSnackbar])

  return (
    <BackgroundSyncContext.Provider
      value={{
        isSaving,
        lastError,
        pendingWorkoutDraft,
        startBackgroundSave,
        retryBackgroundSave,
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
