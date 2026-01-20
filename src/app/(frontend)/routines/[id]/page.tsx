'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import { ArrowBack, Edit, PlayArrow } from '@mui/icons-material'

export default function RoutineDetailPage() {
  const router = useRouter()
  const params = useParams()

  // Mock data - would normally fetch based on params.id
  const routine = {
    id: params.id,
    name: 'Push Day',
    description: 'Chest, Shoulders, Triceps',
    exercises: [
      { id: 1, name: 'Bench Press', sets: 4, reps: 8, restSeconds: 90 },
      { id: 2, name: 'Incline Dumbbell Press', sets: 3, reps: 10, restSeconds: 60 },
      { id: 3, name: 'Shoulder Press', sets: 4, reps: 10, restSeconds: 60 },
      { id: 4, name: 'Lateral Raises', sets: 3, reps: 12, restSeconds: 45 },
      { id: 5, name: 'Tricep Pushdowns', sets: 3, reps: 12, restSeconds: 45 },
      { id: 6, name: 'Overhead Tricep Extension', sets: 3, reps: 10, restSeconds: 45 },
    ],
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
        position="static"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.push('/routines')}
            sx={{ color: 'text.primary', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', flexGrow: 1 }}>
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
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 0.5 }}>
            {routine.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {routine.exercises.length} exercises • {routine.description}
          </Typography>
        </Box>

        {/* Exercise List */}
        <Card
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <List sx={{ p: 0 }}>
              {routine.exercises.map((exercise, index) => (
                <React.Fragment key={exercise.id}>
                  <ListItem
                    sx={{
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '4px',
                        bgcolor: 'surfaceContainer',
                        border: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                      >
                        {index + 1}
                      </Typography>
                    </Box>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                          {exercise.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {exercise.sets} × {exercise.reps} • {exercise.restSeconds}s rest
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < routine.exercises.length - 1 && <Divider sx={{ bgcolor: 'divider' }} />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            mb: 3,
            py: 1.5,
            borderTop: 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              {routine.exercises.reduce((sum, ex) => sum + ex.sets, 0)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Total Sets
            </Typography>
          </Box>
          <Box>
            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              ~45 min
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Est. Duration
            </Typography>
          </Box>
        </Box>

        {/* Start Workout Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<PlayArrow />}
          onClick={() => router.push('/workout')}
          sx={{
            py: 1.5,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: 1,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: 'none',
            },
          }}
        >
          Start Workout
        </Button>
      </Container>
    </Box>
  )
}
