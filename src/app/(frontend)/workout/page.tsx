'use client'

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  IconButton,
  TextField,
  Checkbox,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SwipeableDrawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Skeleton,
  Fade,
} from '@mui/material'
import {
  CheckCircle,
  RadioButtonUnchecked,
  Close,
  Check,
  DeleteOutline,
  Timer as TimerIcon,
} from '@mui/icons-material'
import DrawerHandle from '@/components/ui/DrawerHandle'
import PageAppBar from '@/components/PageAppBar'
import RestTimePickerDrawer from '@/components/RestTimePickerDrawer'
import { loadWorkoutFromRoutine } from '@/lib/api/workout'
import { useAuth } from '@/contexts/AuthContext'
import { toKg, formatWeight, type WeightUnit } from '@/lib/utils/weightConversion'
import { useSnackbar } from '@/hooks/useSnackbar'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'

// Types
type SetType = 'N' | 'W' | 'D'

const SET_TYPE_LABELS: { [key in SetType]: string } = {
  N: 'Normal',
  W: 'Warm Up',
  D: 'Drop Set',
}

interface WorkoutSet {
  id?: string
  type: SetType
  weight: string
  reps: string
  completed: boolean
  previous?: string
  setOrder?: number
}

interface WorkoutExercise {
  id: string
  exerciseId?: string // Actual DB exercise ID (for saving)
  name: string
  restTime: number // seconds
  sets: WorkoutSet[]
}

function WorkoutLoggingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()
  const session = useWorkoutSession()
  const [elapsedTime, setElapsedTime] = useState(0)

  // Active Rest Timer State
  const [activeRestTimer, setActiveRestTimer] = useState<{
    endTime: number
    duration: number
    exerciseId: string
  } | null>(null)
  const [remainingRest, setRemainingRest] = useState(0)

  // Rest Timer Effect
  useEffect(() => {
    if (!activeRestTimer) return

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeRestTimer.endTime - Date.now()) / 1000))
      setRemainingRest(remaining)
      if (remaining <= 0) {
        setActiveRestTimer(null)
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
      }
    }, 200)

    return () => clearInterval(interval)
  }, [activeRestTimer])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Active Set for Set Options Drawer
  const [activeSet, setActiveSet] = useState<{ exerciseId: string; setId: string } | null>(null)

  // Track last-completed set for animation
  const [_completedSetKey, setCompletedSetKey] = useState<string | null>(null)

  // Rest Time Configuration State
  const [activeRestTimeExerciseId, setActiveRestTimeExerciseId] = useState<string | null>(null)

  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false)
  const [_isSaving, setIsSaving] = useState(false)
  const workoutInitializedRef = useRef(false)
  const routineIdRef = useRef<string | null>(null)
  const workoutDateRef = useRef<string>(new Date().toISOString())
  const preferredUnitRef = useRef<WeightUnit>('kg')
  // Store exerciseId mapping for saving
  const exerciseDataRef = useRef<Array<{ exerciseId: string; name: string }>>([])

  // Timer Effect — derives elapsed from session context startedAt
  useEffect(() => {
    if (!session.isActive || exercises.length === 0) return
    // Update immediately
    setElapsedTime(session.getElapsedSeconds())
    const timer = setInterval(() => {
      setElapsedTime(session.getElapsedSeconds())
    }, 1000)
    return () => clearInterval(timer)
  }, [session, exercises.length])

  // Sync exercises to context via useEffect (avoids setState-during-render)
  const exercisesSyncedRef = useRef(false)
  useEffect(() => {
    // Skip the initial render and the first set from loadWorkout (already in context)
    if (!exercisesSyncedRef.current) {
      if (exercises.length > 0) exercisesSyncedRef.current = true
      return
    }
    if (session.isActive && exercises.length > 0) {
      session.updateSession(exercises)
    }
  }, [exercises]) // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent accidental navigation during active workout
  useEffect(() => {
    if (!session.isActive) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [session.isActive])

  // Prefetch summary page so it's cached by SW for offline use
  useEffect(() => {
    router.prefetch('/workout/summary')
  }, [router])

  // Load workout — either resume from context or fetch from API
  useEffect(() => {
    const loadWorkout = async () => {
      const routineId = searchParams.get('routineId')
      if (!routineId || !user) {
        console.error('No routineId or user provided')
        return
      }

      if (workoutInitializedRef.current) return

      // Refinement #1: Resume from context if session matches (no API call)
      if (session.isActive && session.routineId === routineId) {
        workoutInitializedRef.current = true
        routineIdRef.current = routineId
        preferredUnitRef.current = user?.preferredUnit || 'kg'
        // Restore exerciseDataRef from context exercises (exerciseId = real DB ID)
        exerciseDataRef.current = session.exercises.map((ex: WorkoutExercise) => ({
          exerciseId: ex.exerciseId || ex.id,
          name: ex.name,
        }))
        setExercises(session.exercises as WorkoutExercise[])
        return
      }

      try {
        workoutInitializedRef.current = true
        setIsLoadingWorkout(true)
        routineIdRef.current = routineId

        const workoutData = await loadWorkoutFromRoutine({ routineId, userId: String(user.id) })

        const userUnit = user?.preferredUnit || 'kg'
        preferredUnitRef.current = userUnit
        workoutDateRef.current = workoutData.date

        exerciseDataRef.current = workoutData.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
        }))

        const exercisesWithConvertedWeights = workoutData.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((set) => {
            let previousDisplay = set.previous
            if (set.previous && set.previous !== '-' && set.previous.includes('x')) {
              const [prevWeight, prevReps] = set.previous.split('x')
              const convertedWeight = formatWeight(parseFloat(prevWeight), userUnit)
              previousDisplay = `${convertedWeight}x${prevReps}`
            }

            return {
              ...set,
              weight: set.weight
                ? formatWeight(parseFloat(set.weight), userUnit)
                : '',
              previous: previousDisplay,
            }
          }),
        }))

        setExercises(exercisesWithConvertedWeights)

        // Start a new session in context
        const routineName = workoutData.exercises[0]?.name ?? 'Workout'
        session.startSession(routineId, routineName, exercisesWithConvertedWeights)
      } catch (err) {
        console.error('Error loading workout:', err)
        showSnackbar({ message: 'Failed to load workout details', severity: 'error' })
        workoutInitializedRef.current = false
      } finally {
        setIsLoadingWorkout(false)
      }
    }

    loadWorkout()
  }, [user?.id, searchParams, session, showSnackbar, user])

  const handleSetChange = (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string,
  ) => {
    setExercises((prev) => {
      const updated = prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        return {
          ...ex,
          sets: ex.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
        }
      })
      return updated
    })
  }

  const handleToggleComplete = (exerciseId: string, setId: string) => {
    // Determine if we are completing a set (checking it)
    let isCompleting = false

    setExercises((prev) => {
      const updated = prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        return {
          ...ex,
          sets: ex.sets.map((set) => {
            if (set.id === setId) {
              isCompleting = !set.completed
              return { ...set, completed: !set.completed }
            }
            return set
          }),
        }
      })
      return updated
    })

    // Trigger Rest Timer if completing
    if (isCompleting) {
      // Flash animation + haptic
      setCompletedSetKey(`${exerciseId}-${setId}`)
      if ('vibrate' in navigator) navigator.vibrate(50)
      setTimeout(() => setCompletedSetKey(null), 600)

      const exercise = exercises.find((e) => e.id === exerciseId)
      if (exercise) {
        setActiveRestTimer({
          endTime: Date.now() + exercise.restTime * 1000,
          duration: exercise.restTime,
          exerciseId,
        })
        setRemainingRest(exercise.restTime)
      }
    }
  }

  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) => {
      const updated = prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        const lastSet = ex.sets[ex.sets.length - 1]
        const newSet: WorkoutSet = {
          id: crypto.randomUUID(),
          type: 'N',
          weight: lastSet ? lastSet.weight : '',
          reps: lastSet ? lastSet.reps : '',
          completed: false,
          previous: '-',
        }
        return { ...ex, sets: [...ex.sets, newSet] }
      })
      return updated
    })
  }

  const handleChangeSetType = (type: SetType) => {
    if (!activeSet) return
    setExercises((prev) => {
      const updated = prev.map((ex) => {
        if (ex.id !== activeSet.exerciseId) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== activeSet.setId) return s
            return { ...s, type }
          }),
        }
      })
      return updated
    })
    setActiveSet(null)
  }

  const handleUpdateRestTime = (seconds: number) => {
    if (!activeRestTimeExerciseId) return
    setExercises((prev) => {
      const updated = prev.map((ex) =>
        ex.id === activeRestTimeExerciseId ? { ...ex, restTime: seconds } : ex,
      )
      return updated
    })
    setActiveRestTimeExerciseId(null)
  }

  const handleRemoveSet = () => {
    if (!activeSet) return
    setExercises((prev) => {
      const updated = prev.map((ex) => {
        if (ex.id !== activeSet.exerciseId) return ex
        return { ...ex, sets: ex.sets.filter((s) => s.id !== activeSet.setId) }
      })
      return updated
    })
    setActiveSet(null)
  }

  const handleToggleAllSets = (exerciseId: string) => {
    setExercises((prev) => {
      const updated = prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        const allCompleted = ex.sets.every((s) => s.completed)
        return {
          ...ex,
          sets: ex.sets.map((s) => ({ ...s, completed: !allCompleted })),
        }
      })
      return updated
    })
  }

  const handleFinishWorkout = async () => {
    if (!routineIdRef.current) {
      router.push('/routines')
      return
    }

    try {
      setIsSaving(true)
      const userUnit = preferredUnitRef.current

      // Build save payload — only include completed (ticked) sets, skip exercises with none
      const exercisesToSave = exercises
        .map((ex, i) => ({
          exerciseId: exerciseDataRef.current[i]?.exerciseId || ex.exerciseId || ex.id,
          name: ex.name,
          sets: ex.sets
            .map((set, setIndex) => ({
              weight: String(toKg(parseFloat(set.weight) || 0, userUnit)),
              reps: set.reps,
              setLabel:
                set.type === 'W'
                  ? 'warmup'
                  : set.type === 'D'
                    ? 'drop'
                    : 'working',
              completed: set.completed,
              setOrder: set.setOrder !== undefined ? set.setOrder : setIndex,
            })),
        }))
        .filter((ex) => ex.sets.some((s) => s.completed))

      // Guard: prevent saving an empty workout
      if (exercisesToSave.length === 0) {
        showSnackbar({
          message: 'No sets completed — tick at least one set to save',
          severity: 'warning',
        })
        setIsSaving(false)
        return
      }

      // Prepare workout data
      const workoutDataToSave = {
        routineId: routineIdRef.current,
        date: workoutDateRef.current,
        durationSeconds: elapsedTime,
        exercises: exercisesToSave,
      }

      // Save to session storage for summary page to read
      sessionStorage.setItem('pendingWorkoutSave', JSON.stringify(workoutDataToSave))

      // End the active session so the beforeunload guard doesn't block navigation
      session.endSession()

      // Navigate to summary page (cached by SW via prefetch on mount)
      router.push(`/workout/summary?temp=true&duration=${elapsedTime}`)
    } catch (err) {
      console.error('Error preparing workout summary:', err)
      showSnackbar({ message: 'Failed to save workout progress', severity: 'error' })
      router.push('/routines')
    } finally {
      setIsSaving(false)
    }
  }

  // Helper for active set details
  const currentActiveSet = useMemo(() => {
    if (!activeSet) return null
    const exercise = exercises.find((e) => e.id === activeSet.exerciseId)
    return exercise?.sets.find((s) => s.id === activeSet.setId)
  }, [activeSet, exercises])

  // Helper for numbering sets logic
  const getSetLabel = (sets: WorkoutSet[], currentIndex: number) => {
    const currentSet = sets[currentIndex]
    if (currentSet.type !== 'N') return currentSet.type

    // Count how many 'N' sets appear before this one
    let normalCount = 0
    for (let i = 0; i <= currentIndex; i++) {
      if (sets[i].type === 'N') normalCount++
    }
    return normalCount
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: activeRestTimer && remainingRest > 0 ? 10 : 1, // Extra padding when rest timer is visible
      }}
    >
      {/* Top AppBar */}
      <PageAppBar title="Log Workout" onBack={() => router.back()} />

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3, pb: 12 }}>
        {/* Timer Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="700">
            Workout
          </Typography>
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', fontWeight: 600 }}
            >
              Duration
            </Typography>
            <Typography variant="h6" fontWeight="700" color="primary.main" sx={{ lineHeight: 1 }}>
              {formatTime(elapsedTime)}
            </Typography>
          </Box>
        </Box>

        {/* Active Rest Timer Overlay */}
        {activeRestTimer && remainingRest > 0 && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 72, // Sit above the Finish Workout button
              left: 0,
              right: 0,
              bgcolor: 'background.default', // #1B1B1F
              color: 'text.primary',
              zIndex: 1200,
              boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTop: 1,
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {/* Progress Bar Line */}
            <Box
              sx={{
                height: 3,
                width: '100%',
                bgcolor: 'surfaceContainerHighest',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  bgcolor: 'primary.main',
                  width: `${(remainingRest / activeRestTimer.duration) * 100}%`,
                  transition: 'width 0.2s linear',
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 2,
                gap: 2,
              }}
            >
              {/* -15s Button */}
              <Button
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveRestTimer((prev) =>
                    prev ? { ...prev, endTime: prev.endTime - 15000 } : null,
                  )
                  setRemainingRest((prev) => Math.max(0, prev - 15))
                }}
                sx={{
                  bgcolor: 'surfaceContainerHigh',
                  color: 'text.primary',
                  minWidth: 'auto',
                  height: 44,
                  px: 2,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  borderRadius: 2,
                  boxShadow: 'none',
                  border: 1,
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'surfaceContainerHighest', boxShadow: 'none' },
                }}
              >
                -15
              </Button>

              {/* Timer Text */}
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    color: 'text.secondary',
                    display: 'block',
                    mb: -0.5,
                  }}
                >
                  Resting
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    color: 'primary.main',
                  }}
                >
                  {formatTime(remainingRest)}
                </Typography>
              </Box>

              {/* Right Side Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* +15s Button */}
                <Button
                  variant="contained"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveRestTimer((prev) =>
                      prev ? { ...prev, endTime: prev.endTime + 15000 } : null,
                    )
                    setRemainingRest((prev) => prev + 15)
                  }}
                  sx={{
                    bgcolor: 'surfaceContainerHigh',
                    color: 'text.primary',
                    minWidth: 'auto',
                    height: 44,
                    px: 2,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    borderRadius: 2,
                    boxShadow: 'none',
                    border: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'surfaceContainerHighest', boxShadow: 'none' },
                  }}
                >
                  +15
                </Button>

                {/* Skip Button */}
                <Button
                  variant="contained"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveRestTimer(null)
                  }}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    minWidth: 'auto',
                    height: 44,
                    px: 3,
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    borderRadius: 2,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
                  }}
                >
                  Skip
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Exercises List */}
        {isLoadingWorkout ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                elevation={1}
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="40%" height={20} />
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 1 }} />
                </Box>
              </Card>
            ))}
          </Stack>
        ) : (
          <Fade in timeout={400}>
            <Stack spacing={2}>
              {exercises.map((exercise) => (
                <Card
                  key={exercise.id}
                  elevation={1}
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  {/* Exercise Header */}
                  <Box
                    sx={{
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {exercise.name}
                      </Typography>
                      <Button
                        startIcon={<TimerIcon sx={{ fontSize: '0.875rem !important' }} />}
                        size="small"
                        variant="contained"
                        onClick={() => setActiveRestTimeExerciseId(exercise.id)}
                        sx={{
                          borderRadius: 1.5,
                          fontWeight: 700,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          textTransform: 'none',
                          minWidth: 'auto',
                          px: 2,
                          boxShadow: 'none',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        {exercise.restTime}s
                      </Button>
                    </Box>
                  </Box>

                  {/* Sets Table */}
                  <TableContainer sx={{ bgcolor: 'transparent' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            align="center"
                            width="15%"
                            sx={{
                              borderBottomColor: 'divider',
                              color: 'text.secondary',
                              fontWeight: 600,
                              py: 1,
                            }}
                          >
                            Set
                          </TableCell>
                          <TableCell
                            align="center"
                            width="20%"
                            sx={{
                              borderBottomColor: 'divider',
                              color: 'text.secondary',
                              fontWeight: 600,
                              py: 1,
                            }}
                          >
                            Prev
                          </TableCell>
                          <TableCell
                            align="center"
                            width="25%"
                            sx={{
                              borderBottomColor: 'divider',
                              color: 'text.secondary',
                              fontWeight: 600,
                              py: 1,
                            }}
                          >
                            kg
                          </TableCell>
                          <TableCell
                            align="center"
                            width="25%"
                            sx={{
                              borderBottomColor: 'divider',
                              color: 'text.secondary',
                              fontWeight: 600,
                              py: 1,
                            }}
                          >
                            Reps
                          </TableCell>
                          <TableCell
                            align="center"
                            width="15%"
                            sx={{
                              borderBottomColor: 'divider',
                              color: 'text.secondary',
                              fontWeight: 600,
                              p: 0,
                            }}
                          >
                            <IconButton
                              onClick={() => handleToggleAllSets(exercise.id)}
                              sx={{
                                color: exercise.sets.every((s) => s.completed)
                                  ? 'primary.main'
                                  : 'text.secondary',
                                minWidth: 44,
                                minHeight: 44,
                              }}
                            >
                              {exercise.sets.every((s) => s.completed) ? (
                                <CheckCircle fontSize="small" />
                              ) : (
                                <Check fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {exercise.sets.map((set, index) => (
                          <TableRow
                            key={set.id}
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                              bgcolor: 'transparent',
                              transition: 'background-color 0.3s ease',
                            }}
                          >
                            {/* Set Number / Type Button */}
                            <TableCell align="center">
                              <Button
                                variant="text"
                                disableElevation
                                size="small"
                                onClick={() =>
                                  setActiveSet({ exerciseId: exercise.id, setId: set.id! })
                                }
                                sx={{
                                  minWidth: 44,
                                  height: 44,
                                  p: 0,
                                  borderRadius: 1,
                                  fontWeight: 700,
                                  fontSize: '0.875rem',
                                  color:
                                    set.type === 'N'
                                      ? 'text.secondary'
                                      : set.type === 'W'
                                        ? 'warning.main'
                                        : set.type === 'D'
                                          ? 'info.main'
                                          : 'error.main',
                                  bgcolor: 'transparent',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  },
                                }}
                              >
                                {getSetLabel(exercise.sets, index)}
                              </Button>
                            </TableCell>

                            {/* Previous Data */}
                            <TableCell align="center">
                              <Typography
                                variant="body1"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{
                                  fontFamily: 'var(--font-mono)',
                                  textAlign: 'center',
                                  width: '100%',
                                  display: 'block',
                                }}
                              >
                                {set.previous || '-'}
                              </Typography>
                            </TableCell>

                            {/* Weight Input */}
                            <TableCell align="center">
                              <TextField
                                variant="standard"
                                placeholder="-"
                                value={set.weight}
                                onChange={(e) =>
                                  handleSetChange(exercise.id, set.id!, 'weight', e.target.value)
                                }
                                inputProps={{
                                  style: {
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontFamily: 'var(--font-mono)',
                                  },
                                  inputMode: 'decimal',
                                }}
                                InputProps={{ disableUnderline: true }}
                                fullWidth
                                size="small"
                              />
                            </TableCell>

                            {/* Reps Input */}
                            <TableCell align="center">
                              <TextField
                                variant="standard"
                                placeholder="-"
                                value={set.reps}
                                onChange={(e) =>
                                  handleSetChange(exercise.id, set.id!, 'reps', e.target.value)
                                }
                                inputProps={{
                                  style: {
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontFamily: 'var(--font-mono)',
                                  },
                                  inputMode: 'numeric',
                                }}
                                InputProps={{ disableUnderline: true }}
                                fullWidth
                                size="small"
                              />
                            </TableCell>

                            {/* Completion Checkbox */}
                            <TableCell align="center" sx={{ p: 0 }}>
                              <Checkbox
                                checked={set.completed}
                                onChange={() => handleToggleComplete(exercise.id, set.id!)}
                                icon={<RadioButtonUnchecked />}
                                checkedIcon={<CheckCircle color="primary" />}
                                sx={{ p: 1.5 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Add Set Button */}
                  <Button
                    fullWidth
                    onClick={() => handleAddSet(exercise.id)}
                    sx={{
                      py: 1.5,
                      borderRadius: 0,
                      borderTop: 1,
                      borderColor: 'divider',
                      color: 'primary.main',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      bgcolor: 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    + Add Set
                  </Button>
                </Card>
              ))}
            </Stack>
          </Fade>
        )}
      </Container>

      {/* Finish Workout Button (Sticky at bottom) */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          p: 2,
          pb: 'calc(16px + env(safe-area-inset-bottom))',
          zIndex: 1000,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleFinishWorkout}
          sx={{
            py: 1.5,
            fontWeight: 700,
            borderRadius: 2,
          }}
        >
          Finish Workout
        </Button>
      </Box>

      {/* Set Options Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={!!activeSet}
        onClose={() => setActiveSet(null)}
        onOpen={() => { }}
        disableSwipeToOpen={true}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <DrawerHandle />
        <Box sx={{ pb: 3 }}>
          <Box
            sx={{
              px: 2,
              py: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Set Options
            </Typography>
            <IconButton onClick={() => setActiveSet(null)} size="small">
              <Close />
            </IconButton>
          </Box>
          <List>
            {(Object.keys(SET_TYPE_LABELS) as SetType[]).map((type) => (
              <ListItemButton key={type} onClick={() => handleChangeSetType(type)}>
                <ListItemText
                  primary={SET_TYPE_LABELS[type]}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                {currentActiveSet?.type === type && <Check color="primary" />}
              </ListItemButton>
            ))}
            <Divider sx={{ my: 1 }} />
            <ListItemButton
              onClick={handleRemoveSet}
              disabled={exercises.find((ex) => ex.id === activeSet?.exerciseId)?.sets.length === 1}
            >
              <ListItemText
                primary="Delete Set"
                primaryTypographyProps={{ color: 'error.main', fontWeight: 600 }}
              />
              <DeleteOutline color="error" />
            </ListItemButton>
          </List>
        </Box>
      </SwipeableDrawer>

      {/* Rest Time Picker Drawer */}
      <RestTimePickerDrawer
        open={!!activeRestTimeExerciseId}
        onClose={() => setActiveRestTimeExerciseId(null)}
        onSave={handleUpdateRestTime}
        initialValue={
          activeRestTimeExerciseId
            ? exercises.find((e) => e.id === activeRestTimeExerciseId)?.restTime
            : 60
        }
      />
    </Box>
  )
}

export default function WorkoutLoggingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkoutLoggingContent />
    </Suspense>
  )
}
