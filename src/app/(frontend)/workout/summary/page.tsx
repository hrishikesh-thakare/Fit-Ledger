'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import apiFetch from '@/lib/api/client'
import { completeWorkout } from '@/lib/api/workout'
import type { WorkoutDay, WorkoutExercise, WorkoutSet } from '@/payload-types'
import { useAuth } from '@/contexts/AuthContext'
import { fromKg, formatWeight } from '@/lib/utils/weightConversion'
import {
  Box,
  Container,
  Typography,
  Card,
  AppBar,
  Toolbar,
  Button,
  List,
  ListItem,
  Divider,
  Stack,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
} from '@mui/material'

export default function WorkoutSummaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [updatePrevWeights, setUpdatePrevWeights] = useState(true)
  const [openDiscardDialog, setOpenDiscardDialog] = useState(false)
  const [workoutData, setWorkoutData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [preferredUnit, setPreferredUnit] = useState<'kg' | 'lb'>('kg')

  useEffect(() => {
    const fetchWorkoutSummary = async () => {
      const workoutDayId = searchParams.get('workoutDayId')
      if (!workoutDayId || !user) {
        console.error('No workoutDayId or user provided')
        setLoading(false)
        return
      }

      try {
        // Fetch user's preferred unit
        const userProfile = await apiFetch(`/users/${user.id}`)
        const userUnit = userProfile.preferredUnit || 'kg'
        setPreferredUnit(userUnit)

        // Fetch workout day
        const workoutDay = await apiFetch<WorkoutDay>(`/workout-days/${workoutDayId}`)

        // Fetch workout exercises
        const workoutExercisesRes = await apiFetch<{ docs: WorkoutExercise[] }>(
          `/workout-exercises?where[workoutDay][equals]=${workoutDayId}&depth=1&sort=exerciseOrder`,
        )

        // Fetch sets for each exercise
        const exercisesWithSets = await Promise.all(
          workoutExercisesRes.docs.map(async (we) => {
            const setsRes = await apiFetch<{ docs: WorkoutSet[] }>(
              `/workout-sets?where[workoutExercise][equals]=${we.id}&sort=setOrder`,
            )

            const exercise = typeof we.exercise === 'object' ? we.exercise : null
            const totalReps = setsRes.docs.reduce((sum, set) => sum + (set.reps || 0), 0)

            // Calculate volume in kg, then convert for display
            const totalVolumeKg = setsRes.docs.reduce(
              (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
              0,
            )
            const totalVolume = fromKg(totalVolumeKg, userUnit)

            const maxWeightKg = Math.max(...setsRes.docs.map((set) => set.weight || 0))
            const maxWeight = fromKg(maxWeightKg, userUnit)

            return {
              id: we.id,
              name: exercise?.name || 'Unknown Exercise',
              sets: setsRes.docs.length,
              reps: totalReps,
              weight: `${formatWeight(maxWeightKg, userUnit)}${userUnit}`,
              volume: totalVolume,
            }
          }),
        )

        const totalVolume = exercisesWithSets.reduce((sum, ex) => sum + ex.volume, 0)
        const durationSeconds = workoutDay.durationSeconds || 0
        const hours = Math.floor(durationSeconds / 3600)
        const mins = Math.floor((durationSeconds % 3600) / 60)
        const secs = durationSeconds % 60
        const durationStr =
          hours > 0
            ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            : `${mins}:${secs.toString().padStart(2, '0')}`

        setWorkoutData({
          duration: durationStr,
          totalVolume,
          exercises: exercisesWithSets,
        })
      } catch (err) {
        console.error('Error fetching workout summary:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutSummary()
  }, [searchParams, user])

  const workoutDataFallback = {
    duration: '0:00',
    totalVolume: 0,
    exercises: [],
  }

  const displayData = workoutData || workoutDataFallback

  const handleSave = async () => {
    const workoutDayId = searchParams.get('workoutDayId')
    const duration = searchParams.get('duration')

    if (!workoutDayId || !duration) {
      console.error('Missing workoutDayId or duration')
      router.push('/dashboard')
      return
    }

    try {
      // Save the workout with duration
      await completeWorkout(workoutDayId, parseInt(duration))
      console.log('Workout saved successfully')
      router.push('/dashboard')
    } catch (err) {
      console.error('Error saving workout:', err)
      // Still navigate even if save fails
      router.push('/dashboard')
    }
  }

  const handleDiscard = () => {
    setOpenDiscardDialog(true)
  }

  const handleConfirmDiscard = async () => {
    const workoutDayId = searchParams.get('workoutDayId')

    if (workoutDayId) {
      try {
        // Delete the workout day (cascade delete will handle exercises/sets)
        await apiFetch(`/workout-days/${workoutDayId}`, {
          method: 'DELETE',
        })
        console.log('Workout discarded successfully')
      } catch (err) {
        console.error('Error discarding workout:', err)
      }
    }

    setOpenDiscardDialog(false)
    router.push('/dashboard')
  }

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
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          top: 0,
          zIndex: 1100,
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              fontSize: '1rem',
              flexGrow: 1,
            }}
          >
            Workout Complete
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {loading ? (
          <Box>
            <Skeleton variant="text" width="60%" height={48} sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mx: 'auto', mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Skeleton variant="rectangular" width="50%" height={100} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width="50%" height={100} sx={{ borderRadius: 2 }} />
            </Box>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
            ))}
          </Box>
        ) : (
          <>
            {/* Header */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                Good Job! 🎉
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You crushed your chest day session.
              </Typography>
            </Box>

            {/* Stats Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 800, mb: 0 }}>
                  {displayData.duration}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}
                >
                  Duration
                </Typography>
              </Card>

              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 800, mb: 0 }}>
                  {displayData.totalVolume.toFixed(1)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}
                >
                  Volume ({preferredUnit})
                </Typography>
              </Card>
            </Box>

            {/* Exercises Summary */}
            <Stack spacing={2} sx={{ mb: 4 }}>
              {displayData.exercises.map((exercise: typeof displayData.exercises[number], index: number) => (
                <Card
                  key={exercise.id}
                  elevation={0}
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: 'surfaceContainerHighest',
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {exercise.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {exercise.sets} sets • {exercise.weight} best
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Stack>

            {/* Settings & Actions */}
            <Box sx={{ mb: 3 }}>
              <Card
                elevation={0}
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 3,
                  p: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={updatePrevWeights}
                      onChange={(e) => setUpdatePrevWeights(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'primary.main',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'primary.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Update Previous Weights
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sync last performed weights to new workouts
                      </Typography>
                    </Box>
                  }
                  sx={{
                    width: '100%',
                    ml: 0,
                    justifyContent: 'space-between',
                    flexDirection: 'row-reverse',
                    m: 0,
                  }}
                />
              </Card>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSave}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                Save Workout
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="text"
                  color="error"
                  size="large"
                  onClick={handleDiscard}
                  sx={{
                    fontWeight: 600,
                    px: 4,
                    borderRadius: 2,
                  }}
                >
                  Discard Workout
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Container>

      {/* Discard Confirmation Dialog */}
      <Dialog
        open={openDiscardDialog}
        onClose={() => setOpenDiscardDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3, bgcolor: 'background.paper', m: 2 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Discard Workout?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary' }}>
            Are you sure you want to discard this workout? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setOpenDiscardDialog(false)}
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDiscard}
            color="error"
            variant="contained"
            disableElevation
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
