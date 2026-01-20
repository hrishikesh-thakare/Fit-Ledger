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
  List,
  ListItem,
  Divider,
} from '@mui/material'

export default function WorkoutSummaryPage() {
  const router = useRouter()

  const workoutData = {
    duration: '45:32',
    totalVolume: 4250,
    exercises: [
      { id: 1, name: 'Bench Press', sets: 4, reps: 32, weight: '60kg', volume: 1920 },
      { id: 2, name: 'Incline Dumbbell Press', sets: 3, reps: 30, weight: '22.5kg', volume: 675 },
      { id: 3, name: 'Shoulder Press', sets: 4, reps: 40, weight: '20kg', volume: 800 },
      { id: 4, name: 'Lateral Raises', sets: 3, reps: 36, weight: '12.5kg', volume: 450 },
      { id: 5, name: 'Tricep Pushdowns', sets: 3, reps: 36, weight: '15kg', volume: 540 },
    ],
  }

  const handleSave = () => {
    router.push('/dashboard')
  }

  const handleDiscard = () => {
    router.push('/dashboard')
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
          <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
              Workout Complete! 🎉
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 0.5 }}>
            Workout Complete
          </Typography>
          <Typography variant="body2" sx={{ color: '#666666' }}>
            Review your session
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <Card
            elevation={0}
            sx={{
              flex: 1,
              bgcolor: '#0a0a0a',
              border: '1px solid #222222',
              borderRadius: 1,
            }}
          >
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 0.25 }}>
                {workoutData.duration}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666666' }}>
                Duration
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              flex: 1,
              bgcolor: '#0a0a0a',
              border: '1px solid #222222',
              borderRadius: 1,
            }}
          >
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 0.25 }}>
                {workoutData.totalVolume}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666666' }}>
                Volume (kg)
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Exercises Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Exercises
          </Typography>

          <Card
            elevation={0}
            sx={{
              bgcolor: '#0a0a0a',
              border: '1px solid #222222',
              borderRadius: 1,
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <List sx={{ p: 0 }}>
                {workoutData.exercises.map((exercise, index) => (
                  <React.Fragment key={exercise.id}>
                    <ListItem
                      sx={{
                        px: 2,
                        py: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
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
                        <Typography variant="caption" sx={{ color: '#888888', fontWeight: 600, fontSize: '0.7rem' }}>
                          {index + 1}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                          {exercise.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666666' }}>
                          {exercise.sets} sets × {exercise.weight}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < workoutData.exercises.length - 1 && (
                      <Divider sx={{ bgcolor: '#1a1a1a' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSave}
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
            Save Workout
          </Button>

          <Button
            fullWidth
            variant="text"
            size="large"
            onClick={handleDiscard}
            sx={{
              py: 1.5,
              color: '#666666',
              fontWeight: 500,
              fontSize: '0.9rem',
              textTransform: 'none',
              borderRadius: 1,
              '&:hover': {
                color: '#888888',
                bgcolor: '#111111',
              },
            }}
          >
            Discard
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
