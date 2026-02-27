'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import apiFetch from '@/lib/api/client'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Fab,
  Alert,
  Chip,
  Stack,
  Fade,
} from '@mui/material'
import {
  FitnessCenter,
  Add,
  ArrowForward,
} from '@mui/icons-material'
import AppScaffold from '@/components/layout/AppScaffold'
import PageContainer from '@/components/layout/PageContainer'
import RoutineCardSkeleton from '@/components/skeletons/RoutineCardSkeleton'
import CardOverflowMenu, { commonActions } from '@/components/CardOverflowMenu'
import { useSnackbar } from '@/hooks/useSnackbar'
import PageAppBar from '@/components/PageAppBar'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'
import { useExtendedFab } from '@/hooks/useExtendedFab'

interface RoutineWithExerciseCount {
  id: number
  name: string
  description: string
  exerciseCount: number
  duration: string
  lastPerformed: string
  notes?: string | null
  previewExercises?: string[]
  muscleGroups?: string[]
}

export default function RoutinesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()
  const { isActive: isWorkoutActive } = useWorkoutSession()
  const { visible: fabVisible } = useExtendedFab(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routines, setRoutines] = useState<RoutineWithExerciseCount[]>([])

  useEffect(() => {
    const fetchRoutines = async () => {
      if (!user) return
      // Fetching routines for user...

      try {
        setLoading(true)
        setError(null)

        const result = await apiFetch<{ docs: RoutineWithExerciseCount[] }>(
          `/custom/routines?userId=${user.id}`,
        )

        setRoutines(result.docs)
      } catch (err) {
        console.error('Error fetching routines:', err)
        setError('Failed to load routines')
      } finally {
        setLoading(false)
      }
    }

    fetchRoutines()
  }, [user])

  const handleEdit = (routineId: number) => {
    router.push(`/routines/${routineId}/edit`)
  }

  const handleDelete = async (routineId: number, routineName: string) => {
    try {
      // Deleting routine...
      await apiFetch(`/routines/${routineId}`, {
        method: 'DELETE',
      })
      // Delete response processed...

      // Remove from local state
      setRoutines((prev) => prev.filter((r) => r.id !== routineId))

      showSnackbar({
        message: `"${routineName}" deleted`,
        severity: 'success',
        duration: 3000,
      })
    } catch (err) {
      console.error('Delete error:', err)
      showSnackbar({
        message: `Failed to delete routine: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <AppScaffold showBottomNav>
      <PageAppBar title="Routines" />

      <PageContainer>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <>
            <RoutineCardSkeleton />
            <RoutineCardSkeleton />
            <RoutineCardSkeleton />
          </>
        ) : (
          <Fade in timeout={400}>
            <Box>
              {/* Routines List */}
              {routines.map((routine) => (
                <Card
                  key={routine.id}
                  elevation={1}
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 2,
                    display: 'flex',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <CardContent sx={{ p: 2, flex: 1, '&:last-child': { pb: 2 } }}>
                    {/* Header: Name + Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            lineHeight: 1.2,
                            mb: 1.5,
                            textTransform: 'capitalize',
                          }}
                        >
                          {routine.name}
                        </Typography>
                        {/* Chips Only */}
                        <Box>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            flexWrap="wrap"
                            gap={0.5}
                            sx={{ mb: 0.5 }}
                          >
                            {(routine.muscleGroups || []).map((mg) => (
                              <Chip
                                key={mg}
                                label={mg}
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  bgcolor: 'action.hover',
                                  color: 'text.secondary',
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Box>

                      <Box>
                        <CardOverflowMenu
                          title={routine.name}
                          actions={[
                            commonActions.edit(() => handleEdit(routine.id)),
                            commonActions.delete(() => handleDelete(routine.id, routine.name)),
                          ]}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, opacity: 0.5 }} />

                    {/* Preview Exercises */}
                    {routine.previewExercises && routine.previewExercises.length > 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                        }}
                      >
                        {routine.previewExercises.join(' · ')}
                        {routine.exerciseCount > routine.previewExercises.length && ' · ...'}
                      </Typography>
                    )}

                    {/* Footer: History & Start Button */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 'auto',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        {routine.exerciseCount} Exercises • {routine.duration}
                      </Typography>

                      <Button
                        variant="contained"
                        size="medium"
                        endIcon={<ArrowForward />}
                        onClick={() => router.push(`/routines/${routine.id}`)}
                        sx={{
                          fontWeight: 700,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          px: 3,
                          boxShadow: 2,
                        }}
                      >
                        Start
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {/* Empty state */}
              {routines.length === 0 && (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                  }}
                >
                  <FitnessCenter sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No routines yet
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Create your first workout routine to get started
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </PageContainer>

      <Fab
        color="primary"
        onClick={() => router.push('/routines/new')}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: isWorkoutActive
            ? 'calc(72px + 16px + 80px + env(safe-area-inset-bottom))'
            : 'calc(72px + 16px + env(safe-area-inset-bottom))',
          zIndex: 1050,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: fabVisible ? 1 : 0,
          transform: fabVisible ? 'scale(1)' : 'scale(0.8)',
          pointerEvents: fabVisible ? 'auto' : 'none',
        }}
      >
        <Add />
      </Fab>
    </AppScaffold>
  )
}
