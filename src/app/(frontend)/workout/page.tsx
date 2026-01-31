'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  AppBar,
  Toolbar,
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
  Menu,
  MenuItem,
  Chip,
} from '@mui/material'
import {
  ArrowBack,
  CheckCircle,
  RadioButtonUnchecked,
  Close,
  Check,
  DeleteOutline,
  Timer as TimerIcon,
} from '@mui/icons-material'
import DrawerHandle from '@/components/ui/DrawerHandle'
import RestTimePickerDrawer from '@/components/RestTimePickerDrawer'

// Types
type SetType = 'N' | 'W' | 'D' | 'F'

const SET_TYPE_LABELS: { [key in SetType]: string } = {
  N: 'Normal',
  W: 'Warm Up',
  D: 'Drop Set',
  F: 'Failure',
}

interface WorkoutSet {
  id: string
  type: SetType
  weight: string
  reps: string
  completed: boolean
  previous?: string
}

interface WorkoutExercise {
  id: string
  name: string
  restTime: number // seconds
  sets: WorkoutSet[]
}

export default function WorkoutLoggingPage() {
  const router = useRouter()
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
      }
    }, 200)

    return () => clearInterval(interval)
  }, [activeRestTimer])

  // Timer Effect (Workout Duration)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Active Set for Set Options Drawer
  const [activeSet, setActiveSet] = useState<{ exerciseId: string; setId: string } | null>(null)

  // Rest Time Configuration State
  const [activeRestTimeExerciseId, setActiveRestTimeExerciseId] = useState<string | null>(null)

  // Mock Data
  const [exercises, setExercises] = useState<WorkoutExercise[]>([
    {
      id: 'ex1',
      name: 'Bench Press',
      restTime: 90,
      sets: [
        { id: 's1', type: 'N', weight: '60', reps: '8', completed: true, previous: '60x8' },
        { id: 's2', type: 'N', weight: '60', reps: '8', completed: true, previous: '60x8' },
        { id: 's3', type: 'N', weight: '60', reps: '8', completed: false, previous: '60x8' },
      ],
    },
    {
      id: 'ex2',
      name: 'Incline Dumbbell Press',
      restTime: 60,
      sets: [
        { id: 's4', type: 'N', weight: '20', reps: '10', completed: false, previous: '18x10' },
        { id: 's5', type: 'N', weight: '20', reps: '10', completed: false, previous: '18x10' },
        { id: 's6', type: 'D', weight: '20', reps: '10', completed: false, previous: '18x10' },
      ],
    },
    {
      id: 'ex3',
      name: 'Cable Flys',
      restTime: 45,
      sets: [
        { id: 's7', type: 'N', weight: '15', reps: '12', completed: false, previous: '-' },
        { id: 's8', type: 'N', weight: '15', reps: '12', completed: false, previous: '-' },
        { id: 's9', type: 'F', weight: '15', reps: '12', completed: false, previous: '-' },
      ],
    },
  ])

  const handleSetChange = (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        return {
          ...ex,
          sets: ex.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
        }
      }),
    )
  }

  const handleToggleComplete = (exerciseId: string, setId: string) => {
    // Determine if we are completing a set (checking it)
    let isCompleting = false

    setExercises((prev) =>
      prev.map((ex) => {
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
      }),
    )

    // Trigger Rest Timer if completing
    if (isCompleting) {
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
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        const lastSet = ex.sets[ex.sets.length - 1]
        const newSet: WorkoutSet = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'N',
          weight: lastSet ? lastSet.weight : '',
          reps: lastSet ? lastSet.reps : '',
          completed: false,
          previous: '-',
        }
        return { ...ex, sets: [...ex.sets, newSet] }
      }),
    )
  }

  const handleChangeSetType = (type: SetType) => {
    if (!activeSet) return
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== activeSet.exerciseId) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== activeSet.setId) return s
            return { ...s, type }
          }),
        }
      }),
    )
    setActiveSet(null)
  }

  const handleUpdateRestTime = (seconds: number) => {
    if (!activeRestTimeExerciseId) return
    setExercises((prev) =>
      prev.map((ex) => (ex.id === activeRestTimeExerciseId ? { ...ex, restTime: seconds } : ex)),
    )
    setActiveRestTimeExerciseId(null)
  }

  const handleRemoveSet = () => {
    if (!activeSet) return
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== activeSet.exerciseId) return ex
        return { ...ex, sets: ex.sets.filter((s) => s.id !== activeSet.setId) }
      }),
    )
    setActiveSet(null)
  }

  const handleFinishWorkout = () => {
    router.push('/workout/summary')
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
        pb: 12, // Space for bottom button
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          top: 0,
          zIndex: 1100,
        }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              fontSize: '1rem',
              flexGrow: 1,
            }}
          >
            Log Workout
          </Typography>

          <Button variant="text" sx={{ fontWeight: 600 }} onClick={handleFinishWorkout}>
            Finish
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Timer Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="800">
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
              bottom: 90, // Adjusted margin
              left: 16,
              right: 16,
              bgcolor: '#1a1a1a', // Dark modern background
              color: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)', // Deep shadow
              borderRadius: 4,
              p: 2.5,
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TimerIcon sx={{ fontSize: 32, color: 'primary.light' }} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  Resting
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ fontFamily: 'var(--font-mono)', lineHeight: 1 }}
                >
                  {formatTime(remainingRest)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => {
                  setActiveRestTimer((prev) =>
                    prev ? { ...prev, endTime: prev.endTime + 30000 } : null,
                  )
                }}
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  fontWeight: 700,
                  color: 'primary.light',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  borderRadius: 2,
                }}
              >
                +30s
              </Button>
              <Button
                size="small"
                onClick={() => setActiveRestTimer(null)}
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  fontWeight: 700,
                  color: '#ff5252',
                  bgcolor: 'rgba(255, 82, 82, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.2)' },
                  borderRadius: 2,
                }}
              >
                Skip
              </Button>
            </Box>
          </Box>
        )}

        <Stack spacing={2}>
          {exercises.map((exercise) => (
            <Card
              key={exercise.id}
              elevation={0}
              sx={{
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
                  bgcolor: 'background.default',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {exercise.name}
                  </Typography>
                  <Button
                    startIcon={<TimerIcon sx={{ fontSize: '0.875rem !important' }} />}
                    size="small"
                    variant="contained"
                    onClick={(e) => setActiveRestTimeExerciseId(exercise.id)}
                    sx={{
                      borderRadius: 4,
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
                          py: 1,
                        }}
                      >
                        <CheckCircle fontSize="small" />
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exercise.sets.map((set, index) => (
                      <TableRow
                        key={set.id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          bgcolor: set.completed ? 'action.selected' : 'transparent',
                        }}
                      >
                        {/* Set Number / Type Button */}
                        <TableCell align="center">
                          <Button
                            variant={set.type === 'N' ? 'text' : 'contained'}
                            color={
                              set.type === 'N' ? 'inherit' : set.type === 'W' ? 'warning' : 'error'
                            }
                            disableElevation
                            size="small"
                            onClick={() => setActiveSet({ exerciseId: exercise.id, setId: set.id })}
                            sx={{
                              minWidth: 28,
                              height: 28,
                              p: 0,
                              borderRadius: 1,
                              fontWeight: 700,
                              color: set.type === 'N' ? 'text.secondary' : 'white',
                              fontSize: '0.75rem',
                              bgcolor: set.type === 'N' ? 'action.hover' : undefined,
                            }}
                          >
                            {getSetLabel(exercise.sets, index)}
                          </Button>
                        </TableCell>

                        {/* Previous Data */}
                        <TableCell align="center">
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
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
                              handleSetChange(exercise.id, set.id, 'weight', e.target.value)
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
                              handleSetChange(exercise.id, set.id, 'reps', e.target.value)
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
                            onChange={() => handleToggleComplete(exercise.id, set.id)}
                            icon={<RadioButtonUnchecked />}
                            checkedIcon={<CheckCircle color="primary" />}
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
      </Container>

      {/* Set Options Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={!!activeSet}
        onClose={() => setActiveSet(null)}
        onOpen={() => {}}
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

      {/* Sticky Bottom Button */}
      {/* Kept wrapper for visual consistency, even though Finish is now in AppBar for better UX with timer, 
          but usually apps have it at bottom. The user didn't ask to move it to top, but adding timer might crowd AppBar.
          Let's keep bottom button as primary action as per original design.
      */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1100,
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleFinishWorkout}
            sx={{
              py: 1.5,
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: 2,
            }}
          >
            Finish Workout
          </Button>
        </Container>
      </Box>

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
