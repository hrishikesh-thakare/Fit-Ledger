'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Card,
  CardContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Drawer,
  Stack,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  ArrowBack,
  Add,
  Close,
  ChevronRight,
  DeleteOutline,
  FitnessCenter,
  Check,
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
  bodyPart?: string
  sets: RoutineSet[]
}

// Dummy Data for Selection
const AVAILABLE_EXERCISES = [
  { name: 'Bench Press', bodyPart: 'Chest' },
  { name: 'Push Up', bodyPart: 'Chest' },
  { name: 'Squat', bodyPart: 'Legs' },
  { name: 'Leg Press', bodyPart: 'Legs' },
  { name: 'Deadlift', bodyPart: 'Back' },
  { name: 'Pull Up', bodyPart: 'Back' },
  { name: 'Dumbbell Row', bodyPart: 'Back' },
  { name: 'Overhead Press', bodyPart: 'Shoulders' },
  { name: 'Lateral Raise', bodyPart: 'Shoulders' },
  { name: 'Bicep Curl', bodyPart: 'Arms' },
  { name: 'Tricep Extension', bodyPart: 'Arms' },
  { name: 'Plank', bodyPart: 'Core' },
  { name: 'Crunches', bodyPart: 'Core' },
]

const BODY_PARTS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

const SET_TYPE_LABELS: { [key in SetType]: string } = {
  N: 'Normal',
  W: 'Warm Up',
  D: 'Drop Set',
  F: 'Failure',
}

export default function NewRoutinePage() {
  const router = useRouter()
  const [openExerciseDrawer, setOpenExerciseDrawer] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedBodyPart, setSelectedBodyPart] = useState('All')

  // State for Set Options Drawer
  const [activeSet, setActiveSet] = useState<{ exerciseId: string; setId: string } | null>(null)

  const handleAddExercise = (exercise: { name: string; bodyPart: string }) => {
    const newExercise: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      name: exercise.name,
      bodyPart: exercise.bodyPart,
      sets: [{ id: Math.random().toString(36).substr(2, 9), type: 'N', weight: '', reps: '' }],
    }
    setExercises([...exercises, newExercise])
    setOpenExerciseDrawer(false)
  }

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id))
  }

  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        // Auto-fill from previous set if exists
        const lastSet = ex.sets[ex.sets.length - 1]
        const newSet: RoutineSet = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'N',
          weight: lastSet ? lastSet.weight : '',
          reps: lastSet ? lastSet.reps : '',
        }
        return { ...ex, sets: [...ex.sets, newSet] }
      }),
    )
  }

  const handleRemoveSet = () => {
    if (!activeSet) return
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== activeSet.exerciseId) return ex
        return { ...ex, sets: ex.sets.filter((s) => s.id !== activeSet.setId) }
      }),
    )
    setActiveSet(null)
  }

  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: keyof RoutineSet,
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        }
      }),
    )
  }

  const handleChangeSetType = (type: SetType) => {
    if (!activeSet) return
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== activeSet.exerciseId) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== activeSet.setId) return s
            return { ...s, type }
          }),
        }
      }),
    )
    setActiveSet(null)
  }

  const filteredExercises = useMemo(() => {
    if (selectedBodyPart === 'All') return AVAILABLE_EXERCISES
    return AVAILABLE_EXERCISES.filter((ex) => ex.bodyPart === selectedBodyPart)
  }, [selectedBodyPart])

  const appBarHeight = 64

  // Helper to find current active set details
  const currentActiveSet = useMemo(() => {
    if (!activeSet) return null
    const exercise = exercises.find((e) => e.id === activeSet.exerciseId)
    return exercise?.sets.find((s) => s.id === activeSet.setId)
  }, [activeSet, exercises])

  // Helper for numbering sets logic
  const getSetLabel = (sets: RoutineSet[], currentIndex: number) => {
    const currentSet = sets[currentIndex]
    if (currentSet.type !== 'N') return currentSet.type

    // Count how many 'N' sets appear before this one (include this one in the count if using 1-based index)
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
        pb: 12, // More padding for bottom bar
      }}
    >
      {/* App Bar (Sticky) */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          top: 0,
          zIndex: 1100,
          height: appBarHeight,
          justifyContent: 'center',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton edge="start" color="inherit" aria-label="back" onClick={() => router.back()}>
            <ArrowBack />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              fontSize: '1rem',
            }}
          >
            Create Routine
          </Typography>

          {/* Spacer for centering logic if needed, or empty box since Button moved */}
          <Box sx={{ width: 48 }} />
        </Toolbar>
      </AppBar>

      {/* Content Area */}
      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        <Stack spacing={3}>
          {/* Routine Info */}
          <Box sx={{ px: 1 }}>
            <TextField
              fullWidth
              label="Routine Name"
              placeholder="e.g., Push Day"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
            />
          </Box>

          {/* Exercises Section */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Exercises
              </Typography>
              <Button
                startIcon={<Add />}
                size="small"
                onClick={() => setOpenExerciseDrawer(true)}
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Add Exercise
              </Button>
            </Box>

            {exercises.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderStyle: 'dashed',
                }}
              >
                <FitnessCenter
                  sx={{ fontSize: '3rem', color: 'text.disabled', mb: 1.5, opacity: 0.5 }}
                />
                <Typography variant="body2" color="text.secondary">
                  No exercises added yet
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {exercises.map((exercise) => (
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
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveExercise(exercise.id)}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
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
                                <Button
                                  variant={set.type === 'N' ? 'text' : 'contained'}
                                  color={
                                    set.type === 'N'
                                      ? 'inherit'
                                      : set.type === 'W'
                                        ? 'warning'
                                        : 'error'
                                  }
                                  disableElevation
                                  size="small"
                                  onClick={() =>
                                    setActiveSet({ exerciseId: exercise.id, setId: set.id })
                                  }
                                  sx={{
                                    minWidth: 32,
                                    height: 32,
                                    p: 0,
                                    borderRadius: 1,
                                    fontWeight: 700,
                                    color: set.type === 'N' ? 'text.secondary' : 'white',
                                    fontSize: '0.75rem',
                                    bgcolor: set.type === 'N' ? 'action.hover' : undefined,
                                  }}
                                >
                                  {getSetLabel(exercise.sets, index)}
                                </Button>
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  variant="standard"
                                  placeholder="-"
                                  value={set.weight}
                                  onChange={(e) =>
                                    handleUpdateSet(exercise.id, set.id, 'weight', e.target.value)
                                  }
                                  inputProps={{
                                    style: { textAlign: 'center', fontWeight: 600 },
                                    inputMode: 'decimal',
                                  }}
                                  InputProps={{ disableUnderline: true }}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  variant="standard"
                                  placeholder="-"
                                  value={set.reps}
                                  onChange={(e) =>
                                    handleUpdateSet(exercise.id, set.id, 'reps', e.target.value)
                                  }
                                  inputProps={{
                                    style: { textAlign: 'center', fontWeight: 600 },
                                    inputMode: 'numeric',
                                  }}
                                  InputProps={{ disableUnderline: true }}
                                  fullWidth
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Add Set Button */}
                    <Button
                      fullWidth
                      onClick={() => handleAddSet(exercise.id)}
                      sx={{
                        py: 1.5,
                        borderRadius: 0,
                        borderTop: 1,
                        borderColor: 'divider',
                        color: 'primary.main',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        bgcolor: 'transparent',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      + Add Set
                    </Button>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Container>

      {/* Save Button (Bottom Sticky) */}
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
            variant="contained"
            fullWidth
            size="large"
            sx={{
              py: 1.5,
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: 2,
            }}
          >
            Save Routine
          </Button>
        </Container>
      </Box>

      {/* Add Exercise Drawer */}
      <Drawer
        anchor="bottom"
        open={openExerciseDrawer}
        onClose={() => setOpenExerciseDrawer(false)}
        PaperProps={{
          sx: {
            height: '85vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ px: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Select Exercise
            </Typography>
            <IconButton onClick={() => setOpenExerciseDrawer(false)} size="small">
              <Close />
            </IconButton>
          </Box>

          {/* Horizontal Body Part Filter */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {BODY_PARTS.map((part) => (
              <Chip
                key={part}
                label={part}
                onClick={() => setSelectedBodyPart(part)}
                color={selectedBodyPart === part ? 'primary' : 'default'}
                variant={selectedBodyPart === part ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>
        </Box>

        {/* Exercises List */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          <List>
            {filteredExercises.map((exercise) => (
              <React.Fragment key={exercise.name}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleAddExercise(exercise)}>
                    <ListItemText
                      primary={exercise.name}
                      secondary={exercise.bodyPart}
                      primaryTypographyProps={{ fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    />
                    <ChevronRight color="action" />
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Set Options Drawer */}
      <Drawer
        anchor="bottom"
        open={!!activeSet}
        onClose={() => setActiveSet(null)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <Box sx={{ pb: 3 }}>
          <Box
            sx={{
              px: 2,
              py: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Set Options
            </Typography>
            <IconButton onClick={() => setActiveSet(null)} size="small">
              <Close />
            </IconButton>
          </Box>
          <List>
            {(Object.keys(SET_TYPE_LABELS) as SetType[]).map((type) => (
              <ListItemButton key={type} onClick={() => handleChangeSetType(type)}>
                <ListItemText
                  primary={SET_TYPE_LABELS[type]}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                {currentActiveSet?.type === type && <Check color="primary" />}
              </ListItemButton>
            ))}
            <Divider sx={{ my: 1 }} />
            <ListItemButton
              onClick={handleRemoveSet}
              disabled={exercises.find((ex) => ex.id === activeSet?.exerciseId)?.sets.length === 1}
            >
              <ListItemText
                primary="Delete Set"
                primaryTypographyProps={{ color: 'error.main', fontWeight: 600 }}
              />
              <DeleteOutline color="error" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </Box>
  )
}
