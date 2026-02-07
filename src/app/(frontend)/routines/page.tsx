'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import apiFetch from '@/lib/api/client'
import type { Routine, RoutineExercise } from '@/payload-types'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Toolbar,
  Button,
  Divider,
  Fab,
  Alert,
} from '@mui/material'
import { FitnessCenter, Add, FormatListBulleted, AccessTime } from '@mui/icons-material'
import BottomNav from '@/components/BottomNav'
import RoutineCardSkeleton from '@/components/skeletons/RoutineCardSkeleton'
import CardOverflowMenu, { commonActions } from '@/components/CardOverflowMenu'
import { useSnackbar } from '@/hooks/useSnackbar'
import AppBarWithScroll from '@/components/AppBarWithScroll'

interface RoutineWithExerciseCount extends Routine {
  exerciseCount: number
  duration: string
  description: string
  lastPerformed: string
}

export default function RoutinesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routines, setRoutines] = useState<RoutineWithExerciseCount[]>([])

  useEffect(() => {
    const fetchRoutines = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch routines for the current user
        const response = await apiFetch<{ docs: Routine[] }>(
          `/routines?where[user][equals]=${user.id}&where[isActive][equals]=active&sort=-createdAt`,
        )

        // Fetch exercise counts for each routine
        const routinesWithCounts = await Promise.all(
          response.docs.map(async (routine) => {
            const exercisesResponse = await apiFetch<{ docs: RoutineExercise[] }>(
              `/routine-exercises?where[routine][equals]=${routine.id}`,
            )
            return {
              ...routine,
              exerciseCount: exercisesResponse.docs.length,
              duration: '-',
              description: routine.notes || '-',
              lastPerformed: '-',
            }
          }),
        )

        setRoutines(routinesWithCounts)
      } catch (err: any) {
        console.error('Error fetching routines:', err)
        setError('Failed to load routines')
      } finally {
        setLoading(false)
      }
    }

    fetchRoutines()
  }, [user])

  const handleEdit = (routineId: number, routineName: string) => {
    router.push(`/routines/${routineId}/edit`)
  }

  const handleDelete = async (routineId: number, routineName: string) => {
    try {
      console.log('Deleting routine:', routineId)
      const response = await apiFetch(`/routines/${routineId}`, {
        method: 'DELETE',
      })
      console.log('Delete response:', response)

      // Remove from local state
      setRoutines((prev) => prev.filter((r) => r.id !== routineId))

      showSnackbar({
        message: `"${routineName}" deleted`,
        severity: 'success',
        duration: 3000,
      })
    } catch (err: any) {
      console.error('Delete error:', err)
      showSnackbar({
        message: `Failed to delete routine: ${err.message || 'Unknown error'}`,
        severity: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 12, // Space for FAB + BottomNav
      }}
    >
      <AppBarWithScroll position="sticky" elevationTrigger={10}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            ROUTINES
          </Typography>
        </Toolbar>
      </AppBarWithScroll>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
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
          <>
            {/* Routines List */}
            {routines.map((routine) => (
              <Card
                key={routine.id}
                elevation={1}
                onClick={() => router.push(`/routines/${routine.id}`)}
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 1.5,
                  cursor: 'pointer',
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  {/* Header: Name + Overflow Menu */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: routine.notes ? 0.5 : 2.5,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: 'text.primary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        flex: 1,
                      }}
                    >
                      {routine.name}
                    </Typography>
                    <CardOverflowMenu
                      title={routine.name}
                      actions={[
                        commonActions.edit(() => router.push(`/routines/${routine.id}/edit`)),
                        commonActions.delete(() => handleDelete(routine.id, routine.name)),
                      ]}
                    />
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                    {routine.description}
                  </Typography>

                  <Divider sx={{ borderColor: 'divider', mb: 2.5, opacity: 0.5 }} />

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
                        {routine.exerciseCount}
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
                        {routine.duration}
                      </Typography>
                    </Box>
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
          </>
        )}
      </Container>

      <Fab
        variant="extended"
        color="primary"
        onClick={() => router.push('/routines/new')}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 'calc(72px + 16px + env(safe-area-inset-bottom))',
          zIndex: 1050,
        }}
      >
        <Add sx={{ mr: 1 }} />
        Create Routine
      </Fab>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  )
}
