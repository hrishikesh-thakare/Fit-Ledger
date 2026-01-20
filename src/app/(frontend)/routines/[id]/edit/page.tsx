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
  Button,
  IconButton,
  TextField,
  List,
  ListItem,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  Save,
  DragIndicator,
  Delete,
  Add,
  Edit,
} from '@mui/icons-material'

export default function RoutineEditorPage() {
  const router = useRouter()
  const params = useParams()

  const [routineName, setRoutineName] = useState('Push Day')
  const [exercises, setExercises] = useState([
    { id: 1, name: 'Bench Press', sets: 4, reps: 8 },
    { id: 2, name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
    { id: 3, name: 'Shoulder Press', sets: 4, reps: 10 },
    { id: 4, name: 'Lateral Raises', sets: 3, reps: 12 },
    { id: 5, name: 'Tricep Pushdowns', sets: 3, reps: 12 },
  ])

  const handleSave = () => {
    // Mock save - just go back
    router.push(`/routines/${params.id}`)
  }

  const handleDeleteExercise = (id: number) => {
    setExercises(exercises.filter(ex => ex.id !== id))
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
            onClick={() => router.back()}
            sx={{ color: '#ffffff', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', flexGrow: 1 }}>
            Edit Routine
          </Typography>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            sx={{
              bgcolor: '#2196F3',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#1976D2',
              },
            }}
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Routine Name Field */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#888888', mb: 1 }}>
            Routine Name
          </Typography>
          <TextField
            fullWidth
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="Enter routine name"
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

        {/* Exercises Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
            Exercises
          </Typography>
        </Box>

        {/* Exercise List */}
        <Card
          sx={{
            bgcolor: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: 2,
            mb: 2,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <List sx={{ p: 0 }}>
              {exercises.map((exercise, index) => (
                <React.Fragment key={exercise.id}>
                  <ListItem
                    sx={{
                      px: 1.5,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    {/* Drag Handle */}
                    <IconButton
                      size="small"
                      sx={{ 
                        color: '#666666',
                        cursor: 'grab',
                        '&:active': {
                          cursor: 'grabbing',
                        },
                      }}
                    >
                      <DragIndicator />
                    </IconButton>

                    {/* Exercise Number */}
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: '#2196F3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {index + 1}
                      </Typography>
                    </Box>

                    {/* Exercise Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600, mb: 0.3 }}>
                        {exercise.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888888', fontSize: '0.85rem' }}>
                        {exercise.sets} sets × {exercise.reps} reps
                      </Typography>
                    </Box>

                    {/* Edit Button */}
                    <IconButton
                      size="small"
                      sx={{ color: '#2196F3' }}
                      onClick={() => {/* Mock edit */}}
                    >
                      <Edit fontSize="small" />
                    </IconButton>

                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      sx={{ color: '#f44336' }}
                      onClick={() => handleDeleteExercise(exercise.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {index < exercises.length - 1 && (
                    <Divider sx={{ bgcolor: '#333333', mx: 2 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Add Exercise Button */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={() => {/* Mock add */}}
          sx={{
            py: 1.5,
            color: '#2196F3',
            borderColor: '#333333',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            borderRadius: 2,
            '&:hover': {
              borderColor: '#2196F3',
              bgcolor: 'rgba(33, 150, 243, 0.08)',
            },
          }}
        >
          Add Exercise
        </Button>

        {/* Helper Text */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem' }}>
            Drag exercises to reorder • Tap to edit details
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
