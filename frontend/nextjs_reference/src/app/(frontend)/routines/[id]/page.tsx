'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import apiFetch from '@/lib/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'
import PageAppBar from '@/components/PageAppBar'
import { formatWeight } from '@/lib/utils/weightConversion'
import {
  Box,
  Container,
  Typography,
  Card,
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
  Alert,
  Skeleton,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import {
  Edit,
  PlayArrow,
  AccessTime,
  FormatListBulleted,
  FitnessCenter,
} from '@mui/icons-material'

type SetType = 'N' | 'W' | 'D'

interface RoutineSet {
  id: string
  type: SetType
  weight: string
  reps: string
}

interface Exercise {
  id: string
  name: string
  sets: RoutineSet[]
}

// Matches the API response structure
interface FetchedRoutineSet {
  id: string
  type: SetType
  weight: string
  reps: string
  setOrder: number
}

interface FetchedExercise {
  id: string
  exerciseId: string
  name: string
  bodyPart?: string
  sets: FetchedRoutineSet[]
  order: number
}

interface FetchedRoutineDetails {
  id: string
  name: string
  description?: string
  exercises: FetchedExercise[]
}

export default function RoutineDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { isActive, routineId: activeRoutineId, endSession } = useWorkoutSession()
  const routineId = params.id as string
  const searchParams = useSearchParams()
  const refreshKey = searchParams.get('t') || ''

  const [routineName, setRoutineName] = useState<string>('')
  const [routineNotes, setRoutineNotes] = useState<string | undefined>(undefined)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preferredUnit, setPreferredUnit] = useState<'kg' | 'lb'>('kg')
  const [showActiveWorkoutDialog, setShowActiveWorkoutDialog] = useState(false)

  useEffect(() => {
    const fetchRoutineDetails = async () => {
      try {
        setLoading(true)

        // Fetch user's preferred unit
        if (user) {
          const userUnit = user.preferredUnit || 'kg'
          setPreferredUnit(userUnit)
        }

        // Optimized single fetch
        const data = await apiFetch<FetchedRoutineDetails>(`/custom/routines/${routineId}`)

        setRoutineName(data.name)
        setRoutineNotes(data.description)

        // Map API response to UI state
        // Note: weights in DB are KG. We need to convert them for display.
        // The API returns raw stored values (KG).
        const mappedExercises: Exercise[] = data.exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets.map((s) => {
            // Format weight based on user preference
            let displayWeight = '-'
            if (s.weight) {
              const weightVal = parseFloat(s.weight)
              if (!isNaN(weightVal)) {
                displayWeight = formatWeight(weightVal, preferredUnit || 'kg')
              }
            }

            return {
              id: s.id,
              type: s.type,
              weight: displayWeight,
              reps: s.reps,
            }
          }),
        }))

        setExercises(mappedExercises)
      } catch (err: unknown) {
        console.error('Error fetching routine details:', err)
        setError('Failed to load routine details')
      } finally {
        setLoading(false)
      }
    }

    fetchRoutineDetails()

    // Re-fetch when returning to this page (e.g. after editing)
    const handleFocus = () => { fetchRoutineDetails() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [routineId, user, preferredUnit, refreshKey])

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

  // Guard: handle "Start Workout" tap
  const handleStartWorkout = () => {
    if (isActive && activeRoutineId !== routineId) {
      // Another workout is active — show confirmation dialog (refinement #6)
      setShowActiveWorkoutDialog(true)
    } else {
      // No active workout, or same routine — navigate directly
      router.push(`/workout?routineId=${routineId}`)
    }
  }

  const handleDiscardAndStart = () => {
    endSession()
    setShowActiveWorkoutDialog(false)
    router.push(`/workout?routineId=${routineId}`)
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
      <PageAppBar
        title="Routine Details"
        onBack={() => router.back()}
        actions={
          <IconButton
            onClick={() => router.push(`/routines/${params.id}/edit`)}
            sx={{ color: 'primary.main' }}
          >
            <Edit />
          </IconButton>
        }
      />

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {loading ? (
          <Box>
            {/* Header Skeleton */}
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="text" width="70%" height={48} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="90%" height={24} sx={{ mb: 3 }} />

              {/* Metrics Row Skeleton */}
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Skeleton variant="text" width={100} height={20} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width={40} height={32} />
                </Box>
                <Box>
                  <Skeleton variant="text" width={100} height={20} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width={40} height={32} />
                </Box>
                <Box>
                  <Skeleton variant="text" width={100} height={20} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width={60} height={32} />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Exercise List Header */}
            <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />

            {/* Exercise Card Skeletons */}
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
                  {/* Exercise Header */}
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Skeleton variant="text" width="60%" height={28} />
                  </Box>

                  {/* Sets Table Skeleton */}
                  <Box sx={{ p: 2 }}>
                    {[1, 2, 3, 4].map((j) => (
                      <Box key={j} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Skeleton variant="text" width={40} />
                        <Skeleton variant="text" width={60} />
                        <Skeleton variant="text" width={80} />
                        <Skeleton variant="text" width={60} />
                      </Box>
                    ))}
                  </Box>
                </Card>
              ))}
            </Stack>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Fade in timeout={400}>
            <Box>
              {/* Routine Header */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 700,
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {routineName}
                </Typography>
                {routineNotes && (
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                    {routineNotes}
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
                sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Workout Plan
              </Typography>

              <Stack spacing={2}>
                {exercises.map((exercise: Exercise) => (
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
                              width="20%"
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
                              width="40%"
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
                              width="40%"
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
                                          : 'info.main',
                                  }}
                                >
                                  {getSetLabel(exercise.sets, index)}
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
            </Box>
          </Fade>
        )}
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
            onClick={handleStartWorkout}
            sx={{
              py: 1.5,
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: 4,
              '&:hover': {
                boxShadow: 6,
              },
            }}
          >
            {isActive && activeRoutineId === routineId ? 'Resume Workout' : 'Start Workout'}
          </Button>
        </Container>
      </Box>

      {/* Active Workout Confirmation Dialog */}
      <Dialog open={showActiveWorkoutDialog} onClose={() => setShowActiveWorkoutDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Workout in Progress</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have an active workout in progress. Starting a new workout will discard your current
            one. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActiveWorkoutDialog(false)}>Cancel</Button>
          <Button onClick={handleDiscardAndStart} color="error" variant="contained">
            Discard &amp; Start New
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
