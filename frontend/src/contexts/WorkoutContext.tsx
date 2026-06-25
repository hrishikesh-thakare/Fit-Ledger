import React, { createContext, useContext, useState, useEffect } from 'react'
import * as Haptics from 'expo-haptics'

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

interface WorkoutContextType {
  isActive: boolean
  routineId: string | null
  elapsedTime: number
  exercises: WorkoutExercise[]
  activeRestTimer: RestTimerState | null
  remainingRest: number
  setRemainingRest: React.Dispatch<React.SetStateAction<number>>
  setExercises: React.Dispatch<React.SetStateAction<WorkoutExercise[]>>
  setActiveRestTimer: React.Dispatch<React.SetStateAction<RestTimerState | null>>
  startWorkout: (id: string, initialExercises: WorkoutExercise[]) => void
  endWorkout: () => void
  formatTime: (seconds: number) => string
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [routineId, setRoutineId] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  
  const [activeRestTimer, setActiveRestTimer] = useState<RestTimerState | null>(null)
  const [remainingRest, setRemainingRest] = useState(0)

  // Timer Effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (isActive) {
      timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000)
    }
    return () => clearInterval(timer)
  }, [isActive])

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
    setExercises(initialExercises)
    setElapsedTime(0)
    setIsActive(true)
  }

  const endWorkout = () => {
    setIsActive(false)
    setRoutineId(null)
    setExercises([])
    setElapsedTime(0)
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
