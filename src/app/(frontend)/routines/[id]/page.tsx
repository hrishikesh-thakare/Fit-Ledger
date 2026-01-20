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
  Chip,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  PlayArrow,
} from '@mui/icons-material'

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
        bgcolor: '#000000',
        pb: 4,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.push('/routines')}
            sx={{ color: '#ffffff', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', flexGrow: 1 }}>
            Routine Details
          </Typography>
          <IconButton
            onClick={() => router.push(`/routines/${params.id}/edit`)}
            sx={{ color: '#2196F3' }}
          >
            <Edit />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Routine Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 0.5 }}>
            {routine.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666666' }}>
            {routine.exercises.length} exercises • {routine.description}
          </Typography>
        </Box>

        {/* Exercise List */}
        <Card
          elevation={0}
          sx={{
            bgcolor: '#0a0a0a',
            border: '1px solid #222222',
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
                        bgcolor: '#1a1a1a',
                        border: '1px solid #333333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#888888', fontWeight: 600 }}>
                        {index + 1}
                      </Typography>
                    </Box>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                          {exercise.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: '#666666' }}>
                          {exercise.sets} × {exercise.reps} • {exercise.restSeconds}s rest
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < routine.exercises.length - 1 && (
                    <Divider sx={{ bgcolor: '#1a1a1a' }} />
                  )}
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
            borderTop: '1px solid #1a1a1a',
            borderBottom: '1px solid #1a1a1a',
          }}
        >
          <Box>
            <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
              {routine.exercises.reduce((sum, ex) => sum + ex.sets, 0)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666666' }}>
              Total Sets
            </Typography>
          </Box>
          <Box>
            <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
              ~45 min
            </Typography>
            <Typography variant="caption" sx={{ color: '#666666' }}>
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
            bgcolor: '#2196F3',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: 1,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#1976D2',
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
