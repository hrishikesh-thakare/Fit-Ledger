'use client'

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

// ─── Types ────────────────────────────────────────────────────────
type SetType = 'N' | 'W' | 'D'

export interface SessionWorkoutSet {
  id?: string
  type: SetType
  weight: string
  reps: string
  completed: boolean
  previous?: string
}

export interface SessionWorkoutExercise {
  id: string
  exerciseId?: string // Real DB exercise ID (for saving)
  name: string
  restTime: number
  sets: SessionWorkoutSet[]
}

interface WorkoutSessionState {
  isActive: boolean
  routineId: string | null
  routineName: string | null
  startedAt: number | null // Date.now() timestamp
  exercises: SessionWorkoutExercise[]
  currentExerciseIndex: number
}

interface WorkoutSessionContextType extends WorkoutSessionState {
  startSession: (
    routineId: string,
    routineName: string,
    exercises: SessionWorkoutExercise[],
  ) => void
  updateSession: (exercises: SessionWorkoutExercise[], currentExerciseIndex?: number) => void
  endSession: () => void
  getElapsedSeconds: () => number
}

const STORAGE_KEY = 'fitledger_active_workout'

const EMPTY_STATE: WorkoutSessionState = {
  isActive: false,
  routineId: null,
  routineName: null,
  startedAt: null,
  exercises: [],
  currentExerciseIndex: 0,
}

// ─── Context ──────────────────────────────────────────────────────
const WorkoutSessionContext = createContext<WorkoutSessionContextType | undefined>(undefined)

// ─── Helpers ──────────────────────────────────────────────────────
function saveToStorage(state: WorkoutSessionState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sessionStorage may be unavailable (SSR, private browsing quota)
  }
}

function loadFromStorage(): WorkoutSessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WorkoutSessionState
    // Sanity check — must have the required fields
    if (parsed.isActive && parsed.routineId && parsed.startedAt) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function clearStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// ─── Provider ─────────────────────────────────────────────────────
export function WorkoutSessionProvider({ children }: { children: ReactNode }) {
  // Always start with empty state to avoid hydration mismatch (SSR has no sessionStorage)
  const [state, setState] = useState<WorkoutSessionState>(EMPTY_STATE)

  // Restore from sessionStorage once on mount (client-only) — refinement #7
  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    const stored = loadFromStorage()
    if (stored) {
      setState(stored)
    }
  }, [])

  // Ref mirrors state for synchronous reads in getElapsedSeconds
  const stateRef = useRef(state)
  stateRef.current = state

  // ── Debounced sessionStorage writes (refinement #3) ───────────
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSave = useCallback((newState: WorkoutSessionState) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      saveToStorage(newState)
    }, 400)
  }, [])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // ── startSession ──────────────────────────────────────────────
  // Refinement #1: caller should check isActive before calling.
  // This function will overwrite — used after explicit discard.
  const startSession = useCallback(
    (routineId: string, routineName: string, exercises: SessionWorkoutExercise[]) => {
      const newState: WorkoutSessionState = {
        isActive: true,
        routineId,
        routineName,
        startedAt: Date.now(),
        exercises,
        currentExerciseIndex: 0,
      }
      setState(newState)
      saveToStorage(newState) // Immediate write for start (not debounced)
    },
    [],
  )

  // ── updateSession ─────────────────────────────────────────────
  const updateSession = useCallback(
    (exercises: SessionWorkoutExercise[], currentExerciseIndex?: number) => {
      setState((prev) => {
        if (!prev.isActive) return prev // No-op if no active session
        const updated = {
          ...prev,
          exercises,
          currentExerciseIndex: currentExerciseIndex ?? prev.currentExerciseIndex,
        }
        debouncedSave(updated) // Debounced write (refinement #3)
        return updated
      })
    },
    [debouncedSave],
  )

  // ── endSession ────────────────────────────────────────────────
  // Refinement #5: only call this after confirmed save success or explicit discard
  const endSession = useCallback(() => {
    setState(EMPTY_STATE)
    clearStorage()
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  // ── getElapsedSeconds ─────────────────────────────────────────
  const getElapsedSeconds = useCallback(() => {
    const { startedAt } = stateRef.current
    if (!startedAt) return 0
    return Math.floor((Date.now() - startedAt) / 1000)
  }, [])

  return (
    <WorkoutSessionContext.Provider
      value={{
        ...state,
        startSession,
        updateSession,
        endSession,
        getElapsedSeconds,
      }}
    >
      {children}
    </WorkoutSessionContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useWorkoutSession() {
  const context = useContext(WorkoutSessionContext)
  if (!context) {
    throw new Error('useWorkoutSession must be used within WorkoutSessionProvider')
  }
  return context
}
