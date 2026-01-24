'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Button,
  Divider,
} from '@mui/material'
import {
  FitnessCenter,
  Add,
  ChevronRight,
  AccessTime,
  FormatListBulleted,
} from '@mui/icons-material'
import BottomNav from '@/components/BottomNav'

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 12, // Space for FAB + BottomNav
      }}
    >
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
        <Toolbar sx={{ justifyContent: 'space-between' }}>
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
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Add Routine Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => router.push('/routines/new')}
            sx={{
              py: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: 'none',
              },
            }}
          >
            New Routine
          </Button>
        </Box>
        {/* Routines List */}
        {routines.map((routine) => (
          <Card
            key={routine.id}
            elevation={0}
            onClick={() => router.push(`/routines/${routine.id}`)}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              mb: 1.5,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              '&:active': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              {/* Header: Name + Arrow */}
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
                  }}
                >
                  {routine.name}
                </Typography>
                <ChevronRight sx={{ color: 'text.disabled' }} />
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
      </Container>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  )
}
