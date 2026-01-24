'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  TextField,
  List,
  ListItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material'
import { ArrowBack, DragIndicator, Delete, Add, Edit } from '@mui/icons-material'

export default function NewRoutinePage() {
  const router = useRouter()

  // Form State
  const [routineName, setRoutineName] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<
    { id: number; name: string; sets: number; reps: string }[]
  >([])

  // Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<{
    id: number
    name: string
    sets: number
    reps: string
  } | null>(null)

  // Drag State
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const handleCreate = () => {
    console.log('Creating routine:', { name: routineName, notes, exercises })
    router.push('/routines')
  }

  const handleDeleteExercise = (id: number) => {
    setExercises(exercises.filter((ex) => ex.id !== id))
  }

  const handleAddExercise = () => {
    const newId = Math.max(...exercises.map((e) => e.id), 0) + 1
    const newExercise = { id: newId, name: 'New Exercise', sets: 3, reps: '10' }
    setExercises([...exercises, newExercise])

    // Auto-open edit for the new exercise
    setEditingExercise(newExercise)
    setEditDialogOpen(true)
  }

  const handleEditClick = (exercise: (typeof exercises)[0]) => {
    setEditingExercise({ ...exercise })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingExercise) {
      // If it was a new exercise being added and edited immediately
      const exists = exercises.find((ex) => ex.id === editingExercise.id)
      if (exists) {
        setExercises(exercises.map((ex) => (ex.id === editingExercise.id ? editingExercise : ex)))
      } else {
        // Fallback (safe)
        setExercises([...exercises, editingExercise])
      }
      setEditDialogOpen(false)
      setEditingExercise(null)
    }
  }

  // Handle cancel edit (if new, remove it)
  const handleCancelEdit = () => {
    // Optional: logic to remove if name is "New Exercise" and user cancelled?
    // For now, keep it simple.
    setEditDialogOpen(false)
    setEditingExercise(null)
  }

  // Drag Handlers
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return

    const _exercises = [...exercises]
    const draggedItemContent = _exercises.splice(dragItem.current, 1)[0]
    _exercises.splice(dragOverItem.current, 0, draggedItemContent)

    dragItem.current = null
    dragOverItem.current = null
    setExercises(_exercises)
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
          <IconButton edge="start" onClick={() => router.back()} sx={{ color: 'text.primary' }}>
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            New Routine
          </Typography>
          <Button
            variant="text"
            onClick={handleCreate}
            disabled={!routineName.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: 'primary.main',
              fontSize: '1rem',
              '&:disabled': {
                color: 'text.disabled',
              },
            }}
          >
            Create
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 4 }}>
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
          Create Routine
        </Typography>

        {/* Routine Name Field */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 700, ml: 1, mb: 0.5, display: 'block' }}
          >
            ROUTINE NAME *
          </Typography>
          <TextField
            fullWidth
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="e.g. Leg Day"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                borderRadius: 2,
                fontWeight: 600,
              },
            }}
          />
        </Box>

        {/* Notes Field */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 700, ml: 1, mb: 0.5, display: 'block' }}
          >
            NOTES (OPTIONAL)
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Description or focus..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                borderRadius: 2,
              },
            }}
          />
        </Box>

        {/* Exercises Section Header */}
        <Box
          sx={{
            mb: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Exercises
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {exercises.length} TOTAL
          </Typography>
        </Box>

        {/* Exercise List */}
        {exercises.length > 0 ? (
          <Card
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              mb: 3,
              overflow: 'hidden',
            }}
          >
            <List sx={{ p: 0 }}>
              {exercises.map((exercise, index) => (
                <React.Fragment key={exercise.id}>
                  <ListItem
                    draggable
                    onDragStart={() => (dragItem.current = index)}
                    onDragEnter={() => (dragOverItem.current = index)}
                    onDragEnd={handleSort}
                    onDragOver={(e) => e.preventDefault()}
                    sx={{
                      px: 2,
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      bgcolor: 'background.paper',
                      cursor: 'grab',
                      '&:active': { cursor: 'grabbing' },
                    }}
                  >
                    {/* Drag Handle */}
                    <DragIndicator sx={{ color: 'action.active', opacity: 0.5 }} />

                    {/* Exercise Custom Number/Badge */}
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        flexShrink: 0,
                      }}
                    />

                    {/* Exercise Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 700 }}>
                        {exercise.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500 }}
                      >
                        {exercise.sets} Sets × {exercise.reps} Reps
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex' }}>
                      <IconButton
                        size="small"
                        sx={{ color: 'text.secondary' }}
                        onClick={() => handleEditClick(exercise)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: 'error.main', opacity: 0.8 }}
                        onClick={() => handleDeleteExercise(exercise.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < exercises.length - 1 && (
                    <Divider sx={{ borderColor: 'divider', opacity: 0.5 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Card>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              mb: 3,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No exercises added yet.
            </Typography>
          </Box>
        )}

        {/* Add Exercise Button */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAddExercise}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            borderRadius: 2,
            borderStyle: 'dashed',
            borderWidth: 2,
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
              bgcolor: 'transparent',
            },
          }}
        >
          Add Exercise
        </Button>
      </Container>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit} fullWidth maxWidth="xs">
        <DialogTitle>Edit Exercise</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Exercise Name"
              fullWidth
              value={editingExercise?.name || ''}
              onChange={(e) =>
                setEditingExercise((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
              autoFocus
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Sets"
                type="number"
                fullWidth
                value={editingExercise?.sets || ''}
                onChange={(e) =>
                  setEditingExercise((prev) =>
                    prev ? { ...prev, sets: parseInt(e.target.value) || 0 } : null,
                  )
                }
              />
              <TextField
                label="Reps"
                fullWidth
                value={editingExercise?.reps || ''}
                onChange={(e) =>
                  setEditingExercise((prev) => (prev ? { ...prev, reps: e.target.value } : null))
                }
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
