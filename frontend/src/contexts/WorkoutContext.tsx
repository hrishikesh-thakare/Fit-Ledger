import React, { createContext, useContext, useState, useEffect } from 'react'
import * as Haptics from 'expo-haptics'
import * as Crypto from 'expo-crypto'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface WorkoutSet {
  id: string
  type: string
  weight: string
  reps: string
  completed: boolean
  previous?: string
}

interface WorkoutExercise {
  id: string
  exerciseId?: string
  name: string
  restTime: number
  sets: WorkoutSet[]
}

interface RestTimerState {
  endTime: number
  duration: number
  exerciseId: string
}

interface SavedWorkoutSession {
  isActive: boolean
  routineId: string | null
  clientId: string | null
  workoutStartTime: number | null
  exercises: WorkoutExercise[]
}

const WORKOUT_STORAGE_KEY = '@fitledger_active_workout'

interface WorkoutContextType {
  isActive: boolean
  routineId: string | null
  clientId: string | null
  elapsedTime: number
  exercises: WorkoutExercise[]
  activeRestTimer: RestTimerState | null
  remainingRest: number
  setRemainingRest: React.Dispatch<React.SetStateAction<number>>
  setExercises: React.Dispatch<React.SetStateAction<WorkoutExercise[]>>
  setActiveRestTimer: React.Dispatch<React.SetStateAction<RestTimerState | null>>
  startWorkout: (id: string, initialExercises: WorkoutExercise[]) => void
  endWorkout: () => Promise<void>
  formatTime: (seconds: number) => string
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [routineId, setRoutineId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  
  const [activeRestTimer, setActiveRestTimer] = useState<RestTimerState | null>(null)
  const [remainingRest, setRemainingRest] = useState(0)
  const [isRestored, setIsRestored] = useState(false)

  // Restore Session Effect
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY)
        if (stored) {
          const session = JSON.parse(stored) as SavedWorkoutSession
          if (session.isActive) {
            setIsActive(session.isActive)
            setRoutineId(session.routineId)
            setClientId(session.clientId)
            setWorkoutStartTime(session.workoutStartTime)
            setExercises(session.exercises)
            if (session.workoutStartTime) {
              setElapsedTime(Math.floor((Date.now() - session.workoutStartTime) / 1000))
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore workout session:', err)
      } finally {
        setIsRestored(true)
      }
    }
    restoreSession()
  }, [])

  // Persist Session Effect
  useEffect(() => {
    if (!isRestored) return

    const saveSession = async () => {
      if (isActive) {
        const session: SavedWorkoutSession = {
          isActive,
          routineId,
          clientId,
          workoutStartTime,
          exercises,
        }
        try {
          await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(session))
        } catch (err) {
          console.error('Failed to save workout session:', err)
        }
      }
    }
    saveSession()
  }, [isRestored, isActive, routineId, clientId, workoutStartTime, exercises])

  // Timer Effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (isActive && workoutStartTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isActive, workoutStartTime])

  // Rest Timer Effect
  useEffect(() => {
    if (!activeRestTimer) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeRestTimer.endTime - Date.now()) / 1000))
      setRemainingRest(remaining)
      if (remaining <= 0) {
        setActiveRestTimer(null)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [activeRestTimer])

  const startWorkout = (id: string, initialExercises: WorkoutExercise[]) => {
    setRoutineId(id)
    
    // Generate UUID v4 for unique session idempotency
    const uuid = Crypto.randomUUID()
    
    setClientId(`sess-${Date.now()}-${uuid}`)
    setExercises(initialExercises)
    setElapsedTime(0)
    setWorkoutStartTime(Date.now())
    setIsActive(true)
  }

  const endWorkout = async () => {
    try {
      await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY)
    } catch (err) {
      console.error('Failed to clear workout session:', err)
    }
    setIsActive(false)
    setRoutineId(null)
    setClientId(null)
    setExercises([])
    setElapsedTime(0)
    setWorkoutStartTime(null)
    setActiveRestTimer(null)
    setRemainingRest(0)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <WorkoutContext.Provider
      value={{
        isActive,
        routineId,
        clientId,
        elapsedTime,
        exercises,
        activeRestTimer,
        remainingRest,
        setRemainingRest,
        setExercises,
        setActiveRestTimer,
        startWorkout,
        endWorkout,
        formatTime,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkoutContext() {
  const context = useContext(WorkoutContext)
  if (context === undefined) {
    throw new Error('useWorkoutContext must be used within a WorkoutProvider')
  }
  return context
}
