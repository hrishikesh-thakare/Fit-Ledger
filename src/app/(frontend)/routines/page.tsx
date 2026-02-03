'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
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
} from '@mui/material'
import {
  FitnessCenter,
  Add,
  ChevronRight,
  AccessTime,
  FormatListBulleted,
  Edit,
  ContentCopy,
  Share,
  Delete,
} from '@mui/icons-material'
import BottomNav from '@/components/BottomNav'
import RoutineCardSkeleton from '@/components/skeletons/RoutineCardSkeleton'

import CardOverflowMenu, { commonActions } from '@/components/CardOverflowMenu'
import { useSnackbar } from '@/hooks/useSnackbar'
import AppBarWithScroll from '@/components/AppBarWithScroll'
import EmptyState from '@/components/EmptyState'

// Mock Data
const routines = [
  {
    id: 1,
    name: 'Push Day',
    exerciseCount: 6,
    duration: '45-60 min',
    description: 'Chest, Shoulders, Triceps focus',
    lastPerformed: '2 days ago',
  },
  {
    id: 2,
    name: 'Pull Day',
    exerciseCount: 5,
    duration: '45-50 min',
    description: 'Back, Biceps, Rear Delts focus',
    lastPerformed: '5 days ago',
  },
  {
    id: 3,
    name: 'Leg Day',
    exerciseCount: 7,
    duration: '60-75 min',
    description: 'Quads, Hamstrings, Calves focus',
    lastPerformed: 'Today',
  },
  {
    id: 4,
    name: 'Upper Body',
    exerciseCount: 8,
    duration: '50-60 min',
    description: 'Full upper body hypertrophy',
    lastPerformed: '1 week ago',
  },
  {
    id: 5,
    name: 'Core & Abs',
    exerciseCount: 4,
    duration: '20-30 min',
    description: 'High intensity core circuit',
    lastPerformed: 'Never',
  },
]

export default function RoutinesPage() {
  const router = useRouter()
  const { showSnackbar } = useSnackbar()
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleEdit = (routineId: number, routineName: string) => {
    router.push(`/routines/${routineId}/edit`)
  }

  const handleDelete = (routineId: number, routineName: string) => {
    showSnackbar({
      message: `"${routineName}" deleted`,
      severity: 'success',
      action: (
        <Button color="inherit" size="small">
          UNDO
        </Button>
      ),
      duration: 5000,
    })
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
                      mb: 0.5,
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
                        commonActions.edit(() => handleEdit(routine.id, routine.name)),
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

            {/* Empty state if needed */}
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
