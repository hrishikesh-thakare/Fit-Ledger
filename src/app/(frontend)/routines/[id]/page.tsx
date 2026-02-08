'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import apiFetch from '@/lib/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { formatWeight } from '@/lib/utils/weightConversion'
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
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  PlayArrow,
  AccessTime,
  FormatListBulleted,
  FitnessCenter,
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

// Matches the API response structure
interface FetchedRoutineSet {
  id: string
  type: SetType
  weight: string
  reps: string
  setOrder: number
  previous?: string
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
  const routineId = params.id as string

  const [routineName, setRoutineName] = useState<string>('')
  const [routineNotes, setRoutineNotes] = useState<string | undefined>(undefined)
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

            // Previous string is usually "weightxreps" or "-"
            // If it's "weightxreps", the weight is likely in KG from the DB or formatted?
            // The API returns "previous" constructed from DB values (KG).
            // So we need to parse and convert previous string too.
            let displayPrevious = s.previous || '-'
            if (displayPrevious !== '-' && displayPrevious?.includes('x')) {
              const [prevWeight, prevReps] = displayPrevious.split('x')
              const prevWeightVal = parseFloat(prevWeight)
              if (!isNaN(prevWeightVal)) {
                displayPrevious = `${formatWeight(prevWeightVal, preferredUnit || 'kg')}x${prevReps}`
              }
            }

            return {
              id: s.id,
              type: s.type,
              weight: displayWeight,
              reps: s.reps,
              previous: displayPrevious,
            }
          }),
        }))

        setExercises(mappedExercises)
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
        ) : (
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
