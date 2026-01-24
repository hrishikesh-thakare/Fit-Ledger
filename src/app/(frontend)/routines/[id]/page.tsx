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
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  PlayArrow,
  AccessTime,
  FormatListBulleted,
  FitnessCenter,
} from '@mui/icons-material'

export default function RoutineDetailPage() {
  const router = useRouter()
  const params = useParams()

  // Mock data - would normally fetch based on params.id
  const routine = {
    id: params.id,
    name: 'Push Day',
    description: 'Chest, Shoulders, Triceps focus for hypertrophy.',
    duration: '45-60 min',
    exercises: [
      { id: 1, name: 'Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
      { id: 2, name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', restSeconds: 60 },
      { id: 3, name: 'Shoulder Press', sets: 4, reps: '10-12', restSeconds: 60 },
      { id: 4, name: 'Lateral Raises', sets: 3, reps: '12-15', restSeconds: 45 },
      { id: 5, name: 'Tricep Pushdowns', sets: 3, reps: '12-15', restSeconds: 45 },
      { id: 6, name: 'Overhead Tricep Extension', sets: 3, reps: '10-12', restSeconds: 45 },
    ],
  }

  const totalSets = routine.exercises.reduce((sum, ex) => sum + ex.sets, 0)

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

        <Card
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            mb: 4,
            overflow: 'hidden',
          }}
        >
          <List sx={{ p: 0 }}>
            {routine.exercises.map((exercise, index) => (
              <React.Fragment key={exercise.id}>
                <ListItem
                  sx={{
                    px: 2.5,
                    py: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      border: 1,
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                      {index + 1}
                    </Typography>
                  </Box>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{ color: 'text.primary', fontWeight: 700, mb: 0.5 }}
                      >
                        {exercise.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <FitnessCenter sx={{ fontSize: '0.8rem' }} /> {exercise.sets} Sets
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 500 }}
                        >
                          {exercise.reps} Reps
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 500, opacity: 0.7 }}
                        >
                          {exercise.restSeconds}s Rest
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < routine.exercises.length - 1 && (
                  <Divider sx={{ borderColor: 'divider', opacity: 0.5 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Card>

        {/* Start Workout Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<PlayArrow />}
          onClick={() => router.push('/workout')}
          sx={{
            py: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 700,
            fontSize: '1.1rem',
            textTransform: 'none',
            borderRadius: 3,
            boxShadow: 4,
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: 6,
            },
          }}
        >
          Start Workout
        </Button>
      </Container>
    </Box>
  )
}
