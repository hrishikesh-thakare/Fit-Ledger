'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Toolbar,
  IconButton,
  List,
  ListItem,
  Divider,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material'
import { ArrowBack, TrendingUp, CalendarToday, FitnessCenter } from '@mui/icons-material'
import AppBarWithScroll from '@/components/AppBarWithScroll'
import apiFetch from '@/lib/api/client'
import { useAuth } from '@/contexts/AuthContext'
import type {
  Exercise,
  MuscleGroup,
  WorkoutSet,
  WorkoutExercise,
  WorkoutDay,
} from '@/payload-types'

interface HistoryEntry {
  date: string
  weight: number
  reps: number
  volume: number
  sets: number
  isPR: boolean
}

interface ProcessedExercise {
  name: string
  muscleGroup: string
  personalBest: {
    weight: number
    reps: number
    date: string
  } | null
  history: HistoryEntry[]
}

export default function ExerciseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const slug = params.id as string

  const [exercise, setExercise] = useState<ProcessedExercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExerciseData = async () => {
      if (!user || !slug) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // The URL slug is derived from exercise.name: "Bench Press" → "bench-press"
        // Convert slug back to a searchable name pattern
        const searchName = slug.replace(/-/g, ' ')

        // Search for exercise by name (case-insensitive like query)
        const searchResponse = await apiFetch<{ docs: Exercise[] }>(
          `/exercises?where[name][like]=${encodeURIComponent(searchName)}&depth=1&limit=1`,
        )

        if (searchResponse.docs.length === 0) {
          setExercise(null)
          setLoading(false)
          return
        }

        const exerciseData = searchResponse.docs[0]
        const numericId = exerciseData.id

        const muscleGroupName =
          typeof exerciseData.muscleGroup === 'object' && exerciseData.muscleGroup !== null
            ? (exerciseData.muscleGroup as MuscleGroup).name
            : 'Unknown'

        // Fetch workout sets for this exercise using the numeric ID
        const setsResponse = await apiFetch<{ docs: WorkoutSet[] }>(
          `/workout-sets?where[workoutExercise.exercise][equals]=${numericId}&sort=-createdAt&limit=200&depth=2`,
        )

        // Process sets into grouped history entries by workout day
        const workoutDayMap = new Map<
          string,
          {
            date: string
            rawDate: Date
            sets: { weight: number; reps: number }[]
          }
        >()

        for (const set of setsResponse.docs) {
          const workoutExercise = set.workoutExercise as WorkoutExercise | undefined
          if (!workoutExercise || typeof workoutExercise === 'number') continue

          const workoutDay = workoutExercise.workoutDay as WorkoutDay | undefined
          if (!workoutDay || typeof workoutDay === 'number') continue

          const dayId = typeof workoutDay === 'object' ? String(workoutDay.id) : String(workoutDay)
          const dateStr = typeof workoutDay === 'object' ? workoutDay.date : ''

          if (!workoutDayMap.has(dayId)) {
            const d = new Date(dateStr)
            workoutDayMap.set(dayId, {
              date: d.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }),
              rawDate: d,
              sets: [],
            })
          }

          workoutDayMap.get(dayId)!.sets.push({
            weight: set.weight,
            reps: set.reps,
          })
        }

        // Convert to history entries
        const historyEntries: (HistoryEntry & { rawDate: Date })[] = []
        let bestWeight = 0
        let bestReps = 0
        let bestDate = ''

        for (const [, entry] of workoutDayMap) {
          // Find best set in this workout
          let maxWeight = 0
          let maxReps = 0
          let totalVolume = 0
          for (const s of entry.sets) {
            totalVolume += s.weight * s.reps
            if (s.weight > maxWeight || (s.weight === maxWeight && s.reps > maxReps)) {
              maxWeight = s.weight
              maxReps = s.reps
            }
          }

          // Track overall personal best
          if (maxWeight > bestWeight || (maxWeight === bestWeight && maxReps > bestReps)) {
            bestWeight = maxWeight
            bestReps = maxReps
            bestDate = entry.date
          }

          historyEntries.push({
            date: entry.date,
            rawDate: entry.rawDate,
            weight: maxWeight,
            reps: maxReps,
            volume: totalVolume,
            sets: entry.sets.length,
            isPR: false, // will set below
          })
        }

        // Sort by date descending
        historyEntries.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())

        // Mark PR entries
        for (const entry of historyEntries) {
          if (entry.weight === bestWeight && entry.reps === bestReps && entry.date === bestDate) {
            entry.isPR = true
          }
        }

        setExercise({
          name: exerciseData.name,
          muscleGroup: muscleGroupName,
          personalBest:
            bestWeight > 0 ? { weight: bestWeight, reps: bestReps, date: bestDate } : null,
          history: historyEntries,
        })
      } catch (err: any) {
        console.error('Error fetching exercise data:', err)
        setError(err.message || 'Failed to load exercise data')
      } finally {
        setLoading(false)
      }
    }

    fetchExerciseData()
  }, [user, slug])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 12,
      }}
    >
      {/* Top AppBar with Scroll Elevation */}
      <AppBarWithScroll position="sticky" elevationTrigger={10}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.back()}
            sx={{ color: 'text.primary', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          {loading ? (
            <Skeleton variant="text" width="50%" height={28} />
          ) : (
            <Typography
              variant="h6"
              sx={{
                color: 'text.primary',
                fontWeight: 900,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {exercise?.name || 'Exercise'}
            </Typography>
          )}
        </Toolbar>
      </AppBarWithScroll>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : loading ? (
          /* Loading Skeleton */
          <Box>
            {/* Personal Best Card Skeleton */}
            <Card
              elevation={1}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="60%" height={48} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="50%" height={16} />
              </CardContent>
            </Card>

            {/* History Header Skeleton */}
            <Skeleton variant="text" width={80} height={24} sx={{ mb: 2 }} />

            {/* History List Skeleton */}
            <Card
              elevation={1}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <React.Fragment key={i}>
                  <Box sx={{ px: 2.5, py: 2 }}>
                    <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="70%" height={28} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                  {i < 4 && <Divider sx={{ mx: 2.5 }} />}
                </React.Fragment>
              ))}
            </Card>
          </Box>
        ) : exercise ? (
          <>
            {/* Muscle Group Chip */}
            {exercise.muscleGroup && (
              <Chip
                label={exercise.muscleGroup}
                size="small"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                }}
              />
            )}

            {/* Personal Best Card */}
            {exercise.personalBest ? (
              <Card
                elevation={1}
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <TrendingUp sx={{ color: 'primary.main', mr: 1, fontSize: '1.25rem' }} />
                    <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700 }}>
                      Personal Best
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
                    <Typography
                      variant="h3"
                      sx={{ color: 'text.primary', fontWeight: 800, mr: 0.5 }}
                    >
                      {exercise.personalBest.weight} kg
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: 'text.secondary', fontWeight: 800, mr: 0.5 }}
                    >
                      ×
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>
                      {exercise.personalBest.reps}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Set on {exercise.personalBest.date}
                  </Typography>
                </CardContent>
              </Card>
            ) : null}

            {/* Historical Performances */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.primary',
                  fontWeight: 800,
                  mb: 2,
                  textTransform: 'uppercase',
                  fontSize: '1rem',
                  letterSpacing: '0.02em',
                }}
              >
                History
              </Typography>

              {exercise.history.length === 0 ? (
                /* Empty History State */
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                  }}
                >
                  <FitnessCenter sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                    No workout history yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Start a workout with this exercise to see your history here
                  </Typography>
                </Box>
              ) : (
                <Card
                  elevation={1}
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <List sx={{ p: 0 }}>
                    {exercise.history.map((entry, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          sx={{
                            px: 2.5,
                            py: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                            <CalendarToday
                              sx={{ fontSize: '0.85rem', color: 'text.secondary', mr: 1 }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ color: 'text.secondary', flex: 1, fontWeight: 500 }}
                            >
                              {entry.date}
                            </Typography>
                            {entry.isPR && (
                              <Chip
                                label="PR"
                                size="small"
                                sx={{
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                  fontWeight: 'bold',
                                  fontSize: '0.65rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 0.5 }}>
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ color: 'text.primary', fontWeight: 800 }}
                              >
                                <span style={{ color: 'var(--mui-palette-primary-main)' }}>
                                  {entry.weight}kg
                                </span>{' '}
                                × {entry.reps}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary', fontWeight: 500 }}
                              >
                                Best set
                              </Typography>
                            </Box>
                            <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                              <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', fontWeight: 600 }}
                              >
                                {entry.sets} sets
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {entry.volume}kg total
                              </Typography>
                            </Box>
                          </Box>
                        </ListItem>
                        {index < exercise.history.length - 1 && (
                          <Divider sx={{ bgcolor: 'divider', mx: 2.5, opacity: 0.5 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Card>
              )}
            </Box>
          </>
        ) : (
          /* Exercise Not Found State */
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
            }}
          >
            <FitnessCenter sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
              Exercise not found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              This exercise may have been removed
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  )
}
