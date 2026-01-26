'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Chip,
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  PlayArrow,
  AccessTime,
  FormatListBulleted,
  FitnessCenter,
  DeleteOutline,
} from '@mui/icons-material'

type SetType = 'N' | 'W' | 'D' | 'F'

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

export default function RoutineDetailPage() {
  const router = useRouter()
  const params = useParams()

  // Mock data - structured to match new data model
  const routine = {
    id: params.id,
    name: 'Push Day',
    description: 'Chest, Shoulders, Triceps focus for hypertrophy.',
    duration: '45-60 min',
    exercises: [
      {
        id: '1',
        name: 'Bench Press',
        sets: [
          { id: '1-1', type: 'W' as SetType, weight: '40', reps: '15' },
          { id: '1-2', type: 'W' as SetType, weight: '60', reps: '10' },
          { id: '1-3', type: 'N' as SetType, weight: '80', reps: '8' },
          { id: '1-4', type: 'N' as SetType, weight: '80', reps: '8' },
          { id: '1-5', type: 'N' as SetType, weight: '80', reps: '8' },
        ],
      },
      {
        id: '2',
        name: 'Incline Dumbbell Press',
        sets: [
          { id: '2-1', type: 'N' as SetType, weight: '30', reps: '10' },
          { id: '2-2', type: 'N' as SetType, weight: '30', reps: '10' },
          { id: '2-3', type: 'N' as SetType, weight: '30', reps: '10' },
        ],
      },
      {
        id: '3',
        name: 'Shoulder Press',
        sets: [
          { id: '3-1', type: 'N' as SetType, weight: '40', reps: '12' },
          { id: '3-2', type: 'N' as SetType, weight: '40', reps: '12' },
          { id: '3-3', type: 'N' as SetType, weight: '40', reps: '12' },
          { id: '3-4', type: 'D' as SetType, weight: '20', reps: '15' },
        ],
      },
      {
        id: '4',
        name: 'Lateral Raises',
        sets: [
          { id: '4-1', type: 'N' as SetType, weight: '12', reps: '15' },
          { id: '4-2', type: 'N' as SetType, weight: '12', reps: '15' },
          { id: '4-3', type: 'F' as SetType, weight: '12', reps: '20' },
        ],
      },
    ],
  }

  const totalSets = routine.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)

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
            {routine.name}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            {routine.description}
          </Typography>

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
                {routine.exercises.length}
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
          {routine.exercises.map((exercise) => (
            <Card
              key={exercise.id}
              elevation={0}
              sx={{
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
                  bgcolor: 'background.default',
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
                        kg
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
                    {exercise.sets.map((set, index) => (
                      <TableRow
                        key={set.id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 32,
                              height: 32,
                              borderRadius: 1,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              color: set.type === 'N' ? 'text.secondary' : 'white',
                              bgcolor:
                                set.type === 'N'
                                  ? 'action.hover'
                                  : set.type === 'W'
                                    ? 'warning.main'
                                    : 'error.main',
                            }}
                          >
                            {getSetLabel(exercise.sets, index)}
                          </Box>
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
            onClick={() => router.push('/workout')}
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
