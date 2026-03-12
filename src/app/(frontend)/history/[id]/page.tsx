'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import apiFetch from '@/lib/api/client'
import type { WorkoutDay, WorkoutExercise, WorkoutSet } from '@/payload-types'
import { useAuth } from '@/contexts/AuthContext'
import { fromKg, formatWeight } from '@/lib/utils/weightConversion'
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Paper,
  Skeleton,
  Fade,
  Chip,
} from '@mui/material'
import { ArrowBack, AccessTime, FitnessCenter, CalendarToday } from '@mui/icons-material'

type SetDisplayType = 'Warmup' | 'Working' | 'Drop'

interface SetDetail {
  id: number
  type: SetDisplayType
  weight: string
  reps: number | string
}

const getSetLabel = (sets: SetDetail[], currentIndex: number) => {
  const currentSet = sets[currentIndex]
  if (currentSet.type === 'Warmup') return 'W'
  if (currentSet.type === 'Drop') return 'D'

  let normalCount = 0
  for (let i = 0; i <= currentIndex; i++) {
    if (sets[i].type === 'Working') normalCount++
  }
  return normalCount
}

interface ExerciseDetail {
  id: number
  name: string
  equipment?: string
  sets: SetDetail[]
}

interface WorkoutDetailsData {
  id: number
  name: string
  date: string
  startTime: string
  endTime: string
  duration: string
  volume: string
  formattedDate: string
  exercises: ExerciseDetail[]
}

export default function HistoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const workoutId = params.id as string

  const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preferredUnit, setPreferredUnit] = useState<'kg' | 'lb'>('kg')

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch user's preferred unit
        const userUnit = user?.preferredUnit || 'kg'
        setPreferredUnit(userUnit)

        // Fetch workout day and exercises in parallel (independent requests)
        const [workoutDay, workoutExercisesResponse] = await Promise.all([
          apiFetch<WorkoutDay>(`/workout-days/${workoutId}`),
          apiFetch<{ docs: WorkoutExercise[] }>(
            `/workout-exercises?where[workoutDay][equals]=${workoutId}&depth=1&sort=exerciseOrder&limit=100`,
          ),
        ])

        // For each exercise, fetch its sets
        // Optimizing: Extract all exercise IDs and fetch sets in one batch
        const exerciseIds = workoutExercisesResponse.docs.map((e) => e.id)
        const setsByExercise: Record<number, WorkoutSet[]> = {}

        if (exerciseIds.length > 0) {
          const setsResponse = await apiFetch<{ docs: WorkoutSet[] }>(
            `/workout-sets?where[workoutExercise][in]=${exerciseIds.join(',')}&sort=setOrder&limit=500`,
          )

          setsResponse.docs.forEach((set) => {
            const exerciseId =
              typeof set.workoutExercise === 'object' ? set.workoutExercise.id : set.workoutExercise
            const idNum = Number(exerciseId)
            if (!setsByExercise[idNum]) {
              setsByExercise[idNum] = []
            }
            setsByExercise[idNum].push(set)
          })
        }

        const setLabelMap: Record<string, SetDisplayType> = {
          warmup: 'Warmup',
          working: 'Working',
          drop: 'Drop',
        }

        const exercisesWithSets = workoutExercisesResponse.docs.map((workoutExercise) => {
          const sets = setsByExercise[workoutExercise.id] || []
          const exercise =
            typeof workoutExercise.exercise === 'object' ? workoutExercise.exercise : null

          return {
            id: workoutExercise.id,
            name: exercise?.name || 'Unknown Exercise',
            equipment: exercise?.equipment || undefined,
            sets: sets.map((set) => ({
              id: set.id,
              type: setLabelMap[set.setLabel] || 'Working',
              weight: formatWeight(set.weight || 0, userUnit),
              reps: set.reps || '-',
            })),
          }
        })

        // Calculate total volume in kg, then convert
        const totalVolumeKg = exercisesWithSets.reduce((sum, exercise) => {
          return (
            sum +
            exercise.sets.reduce((exSum, set) => {
              const repsNum = set.reps === '-' ? 0 : Number(set.reps)
              return exSum + parseFloat(set.weight) * repsNum
            }, 0)
          )
        }, 0)
        const totalVolume = fromKg(totalVolumeKg, userUnit)

        // Format duration
        const durationSeconds = workoutDay.durationSeconds || 0
        const hours = Math.floor(durationSeconds / 3600)
        const minutes = Math.floor((durationSeconds % 3600) / 60)
        const seconds = durationSeconds % 60
        const durationStr =
          hours > 0
            ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

        // Format dates
        const workoutDate = new Date(workoutDay.date)
        const formattedDate = workoutDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
        const fullDate = workoutDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
        const startTime = workoutDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        const endDate = new Date(workoutDate.getTime() + durationSeconds * 1000)
        const endTime = endDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })

        setWorkoutDetails({
          id: workoutDay.id,
          name: workoutDay.title || 'Workout',
          date: fullDate,
          startTime,
          endTime,
          duration: durationStr,
          volume: `${totalVolume.toLocaleString()} ${userUnit}`,
          formattedDate,
          exercises: exercisesWithSets,
        })
      } catch (err) {
        console.error('Error fetching workout details:', err)
        setError('Failed to load workout details')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutDetails()
  }, [workoutId, user])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 4,
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', top: 0 }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.back()}
            sx={{ color: 'text.primary', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            Workout Details
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {loading ? (
          <Box>
            <Skeleton variant="text" width="70%" height={48} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="50%" height={28} sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="80%" height={32} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="80%" height={32} />
              </Box>
            </Box>
            <Divider sx={{ mb: 4 }} />
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                elevation={1}
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="40%" height={20} />
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
                </Box>
              </Card>
            ))}
          </Box>
        ) : error || !workoutDetails ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body2" sx={{ color: 'error.main' }}>
              {error || 'Workout not found'}
            </Typography>
          </Box>
        ) : (
          <Fade in timeout={400}>
            <Box>
              {/* Header Summary Card */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 0.5,
                    letterSpacing: '-0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  {workoutDetails.name}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: 'text.secondary', mb: 3, display: 'flex', alignItems: 'center' }}
                >
                  <CalendarToday sx={{ fontSize: '1rem', mr: 0.8, mb: 0.2 }} />
                  {workoutDetails.date} • {workoutDetails.startTime}
                </Typography>

                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 'bold', letterSpacing: '0.05em' }}
                    >
                      DURATION
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <AccessTime sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {workoutDetails.duration}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 'bold', letterSpacing: '0.05em' }}
                    >
                      VOLUME
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <FitnessCenter sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {workoutDetails.volume}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Exercises List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {workoutDetails.exercises.map((exercise) => (
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
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {exercise.name}
                        {exercise.equipment && (
                          <Chip
                            label={exercise.equipment.replace('_', ' ')}
                            size="small"
                            variant="filled"
                            color="secondary"
                            sx={{
                              textTransform: 'capitalize',
                              fontSize: '0.65rem',
                              height: 18,
                              lineHeight: 1,
                            }}
                          />
                        )}
                      </Typography>
                    </Box>

                    {/* Set Table */}
                    <TableContainer
                      component={Paper}
                      elevation={0}
                      sx={{ bgcolor: 'background.paper' }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              align="center"
                              sx={{
                                color: 'text.secondary',
                                fontWeight: 'bold',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                width: '20%',
                              }}
                            >
                              SET
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                color: 'text.secondary',
                                fontWeight: 'bold',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                width: '40%',
                              }}
                            >
                              WEIGHT &nbsp;
                              <Typography variant="caption" component="span" color="text.disabled">
                                ({preferredUnit})
                              </Typography>
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                color: 'text.secondary',
                                fontWeight: 'bold',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                width: '40%',
                              }}
                            >
                              REPS
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
                              }}
                            >
                              <TableCell
                                align="center"
                                scope="row"
                                sx={{
                                  color:
                                    set.type === 'Working'
                                      ? 'text.secondary'
                                      : set.type === 'Warmup'
                                        ? 'warning.main'
                                        : set.type === 'Drop'
                                          ? 'info.main'
                                          : 'error.main',
                                  fontSize: '0.875rem',
                                  fontWeight: set.type === 'Working' ? 400 : 700,
                                }}
                              >
                                {getSetLabel(exercise.sets, index)}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ fontWeight: '600', fontSize: '1rem' }}
                              >
                                {set.weight}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ fontWeight: '600', fontSize: '1rem' }}
                              >
                                {set.reps}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                ))}
              </Box>

              <Box sx={{ mt: 6, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Workout Completed
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  )
}
