'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Collapse,
  List,
  ListItem,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material'

export default function WorkoutHistoryDetailPage() {
  const router = useRouter()
  const params = useParams()

  const [expandedExercise, setExpandedExercise] = useState<number | null>(null)
  const [notes, setNotes] = useState('Great workout! Felt strong on bench press today.')

  // Mock data - would normally fetch based on params.id
  const workout = {
    id: params.id,
    name: 'Push Day',
    date: 'January 15, 2026',
    time: '2:30 PM',
    duration: '45 min',
    totalVolume: 4250,
    exercises: [
      {
        id: 1,
        name: 'Bench Press',
        sets: [
          { set: 1, weight: 60, reps: 8, completed: true },
          { set: 2, weight: 60, reps: 8, completed: true },
          { set: 3, weight: 60, reps: 8, completed: true },
          { set: 4, weight: 60, reps: 8, completed: true },
        ],
      },
      {
        id: 2,
        name: 'Incline Dumbbell Press',
        sets: [
          { set: 1, weight: 22.5, reps: 10, completed: true },
          { set: 2, weight: 22.5, reps: 10, completed: true },
          { set: 3, weight: 22.5, reps: 10, completed: true },
        ],
      },
      {
        id: 3,
        name: 'Shoulder Press',
        sets: [
          { set: 1, weight: 20, reps: 10, completed: true },
          { set: 2, weight: 20, reps: 10, completed: true },
          { set: 3, weight: 20, reps: 10, completed: true },
          { set: 4, weight: 20, reps: 10, completed: true },
        ],
      },
      {
        id: 4,
        name: 'Lateral Raises',
        sets: [
          { set: 1, weight: 12.5, reps: 12, completed: true },
          { set: 2, weight: 12.5, reps: 12, completed: true },
          { set: 3, weight: 12.5, reps: 12, completed: true },
        ],
      },
    ],
  }

  const handleToggleExpand = (exerciseId: number) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId)
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
            onClick={() => router.push('/history')}
            sx={{ color: '#ffffff', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
            Workout Details
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Workout Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 0.5 }}>
            {workout.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666666' }}>
            {workout.date} • {workout.duration} • {workout.totalVolume}kg
          </Typography>
        </Box>

        {/* Exercises List */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Exercises
          </Typography>

          {workout.exercises.map((exercise) => (
            <Card
              key={exercise.id}
              elevation={0}
              sx={{
                bgcolor: '#0a0a0a',
                border: '1px solid #222222',
                borderRadius: 1,
                mb: 1.5,
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {/* Exercise Header */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    '&:active': {
                      bgcolor: '#111111',
                    },
                  }}
                  onClick={() => handleToggleExpand(exercise.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                        {exercise.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666666' }}>
                        {exercise.sets.length} sets
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: '#666666' }}>
                      {expandedExercise === exercise.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                </Box>

                {/* Expanded Sets */}
                <Collapse in={expandedExercise === exercise.id}>
                  <Divider sx={{ bgcolor: '#1a1a1a' }} />
                  <List sx={{ p: 0 }}>
                    {exercise.sets.map((set, setIndex) => (
                      <React.Fragment key={set.set}>
                        <ListItem
                          sx={{
                            px: 2,
                            py: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Typography variant="caption" sx={{ color: '#666666', width: 50 }}>
                              Set {set.set}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#888888', flex: 1 }}>
                              {set.weight}kg × {set.reps}
                            </Typography>
                          </Box>
                        </ListItem>
                        {setIndex < exercise.sets.length - 1 && (
                          <Divider sx={{ bgcolor: '#1a1a1a' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Notes Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
            Notes
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this workout..."
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#ffffff',
                bgcolor: '#1a1a1a',
                '& fieldset': {
                  borderColor: '#333333',
                },
                '&:hover fieldset': {
                  borderColor: '#2196F3',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2196F3',
                },
              },
            }}
          />
        </Box>
      </Container>
    </Box>
  )
}
