'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import apiFetch from '@/lib/api/client'
import type { WorkoutDay, WorkoutExercise, WorkoutSet } from '@/payload-types'
import { useAuth } from '@/contexts/AuthContext'
import { fromKg, formatWeight } from '@/lib/utils/weightConversion'
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  Stack,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  Fade,
  CircularProgress,
} from '@mui/material'
import { useSnackbar } from '@/hooks/useSnackbar'
import PageAppBar from '@/components/PageAppBar'
import { useBackgroundSync } from '@/contexts/BackgroundSyncContext'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'

function WorkoutSummaryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [updatePrevWeights, setUpdatePrevWeights] = useState(true)
  const [openDiscardDialog, setOpenDiscardDialog] = useState(false)
  const [workoutData, setWorkoutData] = useState<{
    duration: string
    totalVolume: number
    exercises: { id: number | string; name: string; sets: number; reps: number; weight: string; volume: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [preferredUnit, setPreferredUnit] = useState<'kg' | 'lb'>('kg')
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const { showSnackbar } = useSnackbar()
  const { isSaving, saveWorkoutLocally } = useBackgroundSync()
  const { endSession } = useWorkoutSession()

  useEffect(() => {
    const mainElement = document.querySelector('main')

    if (openDiscardDialog) {
      if (mainElement) {
        mainElement.setAttribute('inert', '')
      }
      // Small timeout to ensure Dialog portal is mounted and ready
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 100)
      return () => {
        clearTimeout(timer)
        if (mainElement) {
          mainElement.removeAttribute('inert')
        }
      }
    }
  }, [openDiscardDialog])

  useEffect(() => {
    const fetchWorkoutSummary = async () => {
      const workoutDayId = searchParams.get('workoutDayId')
      const isTemp = searchParams.get('temp') === 'true'

      if ((!workoutDayId && !isTemp) || !user) {
        console.error('No workoutDayId or user provided')
        setLoading(false)
        return
      }

      try {
        // Fetch user's preferred unit
        const userUnit = user.preferredUnit || 'kg'
        setPreferredUnit(userUnit)

        if (isTemp) {
          // TEMP MODE: Load from session storage
          const pendingDataStr = sessionStorage.getItem('pendingWorkoutSave')
          if (!pendingDataStr) {
            router.push('/routines')
            return
          }
          const pendingData = JSON.parse(pendingDataStr)

          // Transform for display
          const exercisesWithSets = pendingData.exercises.map((ex: { exerciseId: string; name: string; sets: { reps: string; weight: string }[] }) => {
            const totalReps = ex.sets.reduce(
              (sum: number, set: { reps: string }) => sum + (parseInt(set.reps) || 0),
              0,
            )

            // Calculate volume (weights are stored in kg in pendingData)
            const totalVolumeKg = ex.sets.reduce(
              (sum: number, set: { weight: string; reps: string }) =>
                sum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0),
              0,
            )
            const totalVolume = fromKg(totalVolumeKg, userUnit)

            const maxWeightKg = Math.max(...ex.sets.map((set: { weight: string }) => parseFloat(set.weight) || 0))

            return {
              id: ex.exerciseId,
              name: ex.name,
              sets: ex.sets.length,
              reps: totalReps,
              weight: `${formatWeight(maxWeightKg, userUnit)}${userUnit}`,
              volume: totalVolume,
            }
          })

          const totalVolume = exercisesWithSets.reduce((sum: number, ex: { volume: number }) => sum + ex.volume, 0)
          const durationSeconds = pendingData.durationSeconds || 0

          // Format duration
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
        } else {
          // VIEW MODE: Fetch from API
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
        }
      } catch (err) {
        console.error('Error fetching workout summary:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutSummary()
  }, [searchParams, user, router])

  const workoutDataFallback = {
    duration: '0:00',
    totalVolume: 0,
    exercises: [],
  }

  const displayData = workoutData || workoutDataFallback

  const handleSave = () => {
    const isTemp = searchParams.get('temp') === 'true'

    if (isTemp) {
      // TEMP MODE: Save to IndexedDB first, sync in background
      const pendingDataStr = sessionStorage.getItem('pendingWorkoutSave')
      if (!pendingDataStr) {
        return
      }

      // Take snapshot, then clear sessionStorage
      const snapshot = JSON.parse(pendingDataStr)
      snapshot.updateRoutineWeights = updatePrevWeights
      sessionStorage.removeItem('pendingWorkoutSave')

      // Save locally (IndexedDB + sync queue) — non-blocking
      void saveWorkoutLocally(snapshot)

      // End the workout session
      endSession()

      // Immediate redirect — app stays fully usable
      router.push('/routines')
    } else {
      // VIEW MODE: Just navigate back
      router.push('/routines')
    }
  }

  const handleDiscard = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Manually blur or focus something outside of current container to avoid aria-hidden conflict
    e.currentTarget.blur()

    // Then open dialog
    setOpenDiscardDialog(true)
  }

  const handleConfirmDiscard = async () => {
    setIsDiscarding(true)
    const workoutDayId = searchParams.get('workoutDayId')
    const isTemp = searchParams.get('temp') === 'true'

    try {
      if (isTemp) {
        sessionStorage.removeItem('pendingWorkoutSave')
        showSnackbar({ message: 'Workout discarded', severity: 'info' })
      } else if (workoutDayId) {
        // Delete the workout day (cascade delete will handle exercises/sets)
        await apiFetch(`/workout-days/${workoutDayId}`, {
          method: 'DELETE',
        })
        // Workout discarded successfully
        showSnackbar({ message: 'Workout discarded', severity: 'info' })
      }

      setOpenDiscardDialog(false)
      endSession()
      router.push('/routines')
    } catch (err) {
      console.error('Error discarding workout:', err)
      showSnackbar({ message: 'Error discarding workout', severity: 'error' })
      setIsDiscarding(false) // Only reset if failed, otherwise we navigate away
    }
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
      <PageAppBar title="Workout Complete" />

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {loading ? (
          <Box>
            {/* "Well Done!!" heading */}
            <Skeleton variant="text" width="50%" height={48} sx={{ mx: 'auto', mb: 3 }} />
            {/* Stats cards row (Duration + Volume) */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Skeleton variant="rectangular" width="50%" height={80} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width="50%" height={80} sx={{ borderRadius: 2 }} />
            </Box>
            {/* Exercise summary cards */}
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={64} sx={{ mb: 2, borderRadius: 2 }} />
            ))}
            {/* Settings toggle card */}
            <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 2 }} />
            {/* Save button */}
            <Skeleton variant="rectangular" height={48} sx={{ mb: 2, borderRadius: 2 }} />
          </Box>
        ) : (
          <Fade in timeout={400}>
            <Box>
              {/* Header */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Well Done!!
                </Typography>
              </Box>

              {/* Stats Cards */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Card
                  elevation={1}
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
                  <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700, mb: 0 }}>
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
                  elevation={1}
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
                  <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700, mb: 0 }}>
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
                {displayData.exercises.map(
                  (exercise: (typeof displayData.exercises)[number], index: number) => (
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
                  ),
                )}
              </Stack>

              {/* Settings & Actions */}
              <Box sx={{ mb: 3 }}>
                <Card
                  elevation={1}
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
                  disabled={isSaving}
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Workout'}
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
            </Box>
          </Fade>
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
            ref={cancelButtonRef}
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
            disabled={isDiscarding}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            {isDiscarding ? <CircularProgress size={24} color="inherit" /> : 'Discard'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default function WorkoutSummaryPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <WorkoutSummaryContent />
    </Suspense>
  )
}
