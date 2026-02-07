'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import apiFetch from '@/lib/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { fromKg, formatWeight } from '@/lib/utils/weightConversion'
import type {
  Routine,
  RoutineExercise,
  RoutineSet as DBRoutineSet,
  Exercise as DBExercise,
} from '@/payload-types'
import {
  Box,
  Container,
  Typography,
  Card,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  PlayArrow,
  AccessTime,
  FormatListBulleted,
  FitnessCenter,
  DeleteOutline,
} from '@mui/icons-material'

type SetType = 'N' | 'W' | 'D' | 'F'

interface RoutineSet {
  id: string
  type: SetType
  weight: string
  reps: string
  previous?: string
}

interface Exercise {
  id: string
  name: string
  sets: RoutineSet[]
}

export default function RoutineDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const routineId = params.id as string

  const [routine, setRoutine] = useState<Routine | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preferredUnit, setPreferredUnit] = useState<'kg' | 'lb'>('kg')

  useEffect(() => {
    const fetchRoutineDetails = async () => {
      try {
        setLoading(true)

        // Fetch user's preferred unit
        if (user) {
          const userProfile = await apiFetch(`/users/${user.id}`)
          const userUnit = userProfile.preferredUnit || 'kg'
          setPreferredUnit(userUnit)
        }

        // 1. Fetch routine basic info
        const routineRes = await apiFetch<Routine>(`/routines/${routineId}`)
        setRoutine(routineRes)

        // 2. Fetch routine-exercises for this routine
        const routineExercisesRes = await apiFetch<{ docs: RoutineExercise[] }>(
          `/routine-exercises?where[routine][equals]=${routineId}&sort=exerciseOrder`,
        )

        // 3. For each routine-exercise, fetch its sets and exercise details
        const exercisesWithSets = await Promise.all(
          routineExercisesRes.docs.map(async (routineExercise) => {
            // Fetch routine-sets for this routine-exercise
            const setsRes = await apiFetch<{ docs: DBRoutineSet[] }>(
              `/routine-sets?where[routineExercise][equals]=${routineExercise.id}&sort=setOrder`,
            )

            // Get exercise details
            const exerciseId =
              typeof routineExercise.exercise === 'number'
                ? routineExercise.exercise
                : routineExercise.exercise.id

            console.log('Fetching exercise:', exerciseId)
            const exerciseRes = await apiFetch<DBExercise>(`/exercises/${exerciseId}`)
            console.log('Exercise response:', exerciseRes)

            // Check if exercise was found
            if (!exerciseRes || !exerciseRes.name) {
              console.error(`Exercise ${exerciseId} not found`)
              return null
            }

            // Map DB set types to display format
            const setTypeMap: Record<string, SetType> = {
              warmup: 'W',
              working: 'N',
              drop: 'D',
            }

            // Fetch previous workout data for this exercise
            const previousWorkoutSets: { [key: number]: string } = {}
            try {
              // Find the most recent completed workout for this exercise
              const recentWorkoutsRes = await apiFetch<{ docs: any[] }>(
                `/workout-exercises?where[exercise][equals]=${exerciseId}&depth=1&sort=-createdAt&limit=1`,
              )

              if (recentWorkoutsRes.docs.length > 0) {
                const recentWorkoutExercise = recentWorkoutsRes.docs[0]
                // Fetch sets for this workout exercise
                const workoutSetsRes = await apiFetch<{ docs: any[] }>(
                  `/workout-sets?where[workoutExercise][equals]=${recentWorkoutExercise.id}&sort=setOrder`,
                )

                // Map previous sets by index
                workoutSetsRes.docs.forEach((workoutSet: any, idx: number) => {
                  if (workoutSet.weight && workoutSet.reps) {
                    const convertedWeight = formatWeight(workoutSet.weight, preferredUnit)
                    previousWorkoutSets[idx] = `${convertedWeight}x${workoutSet.reps}`
                  }
                })
              }
            } catch (err) {
              console.error('Error fetching previous workout data:', err)
            }

            return {
              id: String(exerciseId),
              name: exerciseRes.name,
              sets: setsRes.docs.map((set, idx) => ({
                id: String(set.id),
                type: setTypeMap[set.setLabel] || 'N',
                weight: set.weight ? formatWeight(set.weight, preferredUnit) : '',
                reps: set.reps?.toString() || '',
                previous: previousWorkoutSets[idx] || '-',
              })),
            }
          }),
        )

        // Filter out any null entries (exercises that weren't found)
        setExercises(exercisesWithSets.filter((ex): ex is Exercise => ex !== null))
      } catch (err: any) {
        console.error('Error fetching routine details:', err)
        setError('Failed to load routine details')
      } finally {
        setLoading(false)
      }
    }

    fetchRoutineDetails()
  }, [routineId, user, preferredUnit])

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)

  // Helper for numbering sets logic
  const getSetLabel = (sets: RoutineSet[], currentIndex: number) => {
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
        pb: 12,
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
          <IconButton
            edge="start"
            onClick={() => router.push('/routines')}
            sx={{ color: 'text.primary', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flexGrow: 1,
            }}
          >
            Routine Details
          </Typography>
          <IconButton
            onClick={() => router.push(`/routines/${params.id}/edit`)}
            sx={{ color: 'primary.main' }}
          >
            <Edit />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : routine ? (
          <>
            {/* Routine Header */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  color: 'text.primary',
                  fontWeight: 900,
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                }}
              >
                {routine.name}
              </Typography>
              {routine.notes && (
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                  {routine.notes}
                </Typography>
              )}

              {/* Metrics Row */}
              <Box sx={{ display: 'flex', gap: 4 }}>
                {/* Exercises */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <FormatListBulleted sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.05em' }}
                    >
                      EXERCISES
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {exercises.length}
                  </Typography>
                </Box>

                {/* Total Sets */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <FitnessCenter sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.05em' }}
                    >
                      TOTAL SETS
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {totalSets}
                  </Typography>
                </Box>

                {/* Duration */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <AccessTime sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.05em' }}
                    >
                      EST. TIME
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    ~45m
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Exercise List */}
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Workout Plan
            </Typography>

            <Stack spacing={2}>
              {exercises.map((exercise: Exercise) => (
                <Card
                  key={exercise.id}
                  elevation={1}
                  sx={{
                    bgcolor: 'background.paper', // User requested bg.ppr
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
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {exercise.name}
                    </Typography>
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
                            }}
                          >
                            Set
                          </TableCell>
                          <TableCell
                            align="center"
                            width="25%"
                            sx={{
                              borderBottomColor: 'divider',
                              color: 'text.secondary',
                              fontWeight: 600,
                            }}
                          >
                            Prev
                          </TableCell>
                          <TableCell
                            align="center"
                            width="30%"
                            sx={{
                              borderBottomColor: 'divider',
                              color: 'text.secondary',
                              fontWeight: 600,
                            }}
                          >
                            {preferredUnit}
                          </TableCell>
                          <TableCell
                            align="center"
                            width="30%"
                            sx={{
                              borderBottomColor: 'divider',
                              color: 'text.secondary',
                              fontWeight: 600,
                            }}
                          >
                            Reps
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {exercise.sets.map((set: RoutineSet, index: number) => (
                          <TableRow
                            key={set.id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color:
                                    set.type === 'N'
                                      ? 'text.secondary'
                                      : set.type === 'W'
                                        ? 'warning.main'
                                        : set.type === 'D'
                                          ? 'info.main'
                                          : 'error.main',
                                }}
                              >
                                {getSetLabel(exercise.sets, index)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {set.previous || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              {set.weight || '-'}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              {set.reps || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              ))}
            </Stack>
          </>
        ) : null}
      </Container>

      {/* Start Workout Button (Bottom Sticky) */}
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
            startIcon={<PlayArrow />}
            onClick={() => router.push(`/workout?routineId=${routineId}`)}
            sx={{
              py: 1.5,
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: 2,
              boxShadow: 4,
              '&:hover': {
                boxShadow: 6,
              },
            }}
          >
            Start Workout
          </Button>
        </Container>
      </Box>
    </Box>
  )
}
