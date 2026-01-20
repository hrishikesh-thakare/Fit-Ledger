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
import { ArrowBack, Save, DragIndicator, Delete, Add, Edit } from '@mui/icons-material'

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
    setExercises(exercises.filter((ex) => ex.id !== id))
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
            onClick={() => router.back()}
            sx={{ color: 'text.primary', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', flexGrow: 1 }}>
            Edit Routine
          </Typography>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Routine Name Field */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Routine Name
          </Typography>
          <TextField
            fullWidth
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="Enter routine name"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
              },
            }}
          />
        </Box>

        {/* Exercises Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
            Exercises
          </Typography>
        </Box>

        {/* Exercise List */}
        <Card
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
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
                        color: 'text.disabled',
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
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'primary.contrastText',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </Box>

                    {/* Exercise Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        sx={{ color: 'text.primary', fontWeight: 600, mb: 0.3 }}
                      >
                        {exercise.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', fontSize: '0.85rem' }}
                      >
                        {exercise.sets} sets × {exercise.reps} reps
                      </Typography>
                    </Box>

                    {/* Edit Button */}
                    <IconButton
                      size="small"
                      sx={{ color: 'primary.main' }}
                      onClick={() => {
                        /* Mock edit */
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>

                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      sx={{ color: 'error.main' }}
                      onClick={() => handleDeleteExercise(exercise.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {index < exercises.length - 1 && <Divider sx={{ bgcolor: 'divider', mx: 2 }} />}
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
          onClick={() => {
            /* Mock add */
          }}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            borderRadius: 2,
          }}
        >
          Add Exercise
        </Button>

        {/* Helper Text */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            Drag exercises to reorder • Tap to edit details
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
