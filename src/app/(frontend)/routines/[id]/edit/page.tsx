'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  SwipeableDrawer,
  Stack,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  ArrowBack,
  Add,
  Close,
  ChevronRight,
  DeleteOutline,
  FitnessCenter,
  Check,
  MoreVert,
  DragHandle,
} from '@mui/icons-material'
import DrawerHandle from '@/components/ui/DrawerHandle'

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

// --- Sortable Item Component ---
function SortableExerciseItem(props: { id: string; name: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, setActivatorNodeRef } =
    useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        p: 0,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          p: 2,
        }}
      >
        {/* Drag Handle */}
        <Box
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            mr: 2,
            color: 'text.secondary',
            touchAction: 'none', // Required for PointerSensor
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <DragHandle />
        </Box>
        <ListItemText primary={props.name} primaryTypographyProps={{ fontWeight: 600 }} />
      </Box>
    </ListItem>
  )
}

export default function EditRoutinePage() {
  const router = useRouter()
  const params = useParams()

  const [openExerciseDrawer, setOpenExerciseDrawer] = useState(false)
  const [selectedBodyPart, setSelectedBodyPart] = useState('All')

  // State for Set Options Drawer
  const [activeSet, setActiveSet] = useState<{ exerciseId: string; setId: string } | null>(null)

  // Menu & Dialog State
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)

  // Initialize with Mock Data for "Push Day"
  const [routineName, setRoutineName] = useState('Push Day')
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: '1',
      name: 'Bench Press',
      bodyPart: 'Chest',
      sets: [
        { id: '1-1', type: 'W', weight: '40', reps: '15' },
        { id: '1-2', type: 'W', weight: '60', reps: '10' },
        { id: '1-3', type: 'N', weight: '80', reps: '8' },
        { id: '1-4', type: 'N', weight: '80', reps: '8' },
        { id: '1-5', type: 'N', weight: '80', reps: '8' },
      ],
    },
    {
      id: '2',
      name: 'Incline Dumbbell Press',
      bodyPart: 'Chest',
      sets: [
        { id: '2-1', type: 'N', weight: '30', reps: '10' },
        { id: '2-2', type: 'N', weight: '30', reps: '10' },
        { id: '2-3', type: 'N', weight: '30', reps: '10' },
      ],
    },
    {
      id: '3',
      name: 'Shoulder Press',
      bodyPart: 'Shoulders',
      sets: [
        { id: '3-1', type: 'N', weight: '40', reps: '12' },
        { id: '3-2', type: 'N', weight: '40', reps: '12' },
        { id: '3-3', type: 'N', weight: '40', reps: '12' },
        { id: '3-4', type: 'D', weight: '20', reps: '15' },
      ],
    },
    {
      id: '4',
      name: 'Lateral Raises',
      bodyPart: 'Shoulders',
      sets: [
        { id: '4-1', type: 'N', weight: '12', reps: '15' },
        { id: '4-2', type: 'N', weight: '12', reps: '15' },
        { id: '4-3', type: 'F', weight: '12', reps: '20' },
      ],
    },
  ])

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

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

  const handleSave = () => {
    // Mock save logic
    router.push(`/routines/${params.id}`)
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
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
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
              flexGrow: 1,
            }}
          >
            Edit Routine
          </Typography>

          <IconButton onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
            <MoreVert />
          </IconButton>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={() => setMenuAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                setMenuAnchorEl(null)
                setReorderDialogOpen(true)
              }}
            >
              Reorder Exercises
            </MenuItem>
          </Menu>
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
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
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
                {exercises.map((exercise, index) => (
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {exercise.name}
                        </Typography>
                      </Box>
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
                                    style: {
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      fontFamily: 'var(--font-mono)',
                                    },
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
                                    style: {
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      fontFamily: 'var(--font-mono)',
                                    },
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
            onClick={handleSave}
            sx={{
              py: 1.5,
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: 2,
            }}
          >
            Update Routine
          </Button>
        </Container>
      </Box>

      {/* Add Exercise Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={openExerciseDrawer}
        onClose={() => setOpenExerciseDrawer(false)}
        onOpen={() => setOpenExerciseDrawer(true)}
        disableSwipeToOpen={false}
        PaperProps={{
          sx: {
            height: '85vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <DrawerHandle />
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
      </SwipeableDrawer>

      {/* Set Options Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={!!activeSet}
        onClose={() => setActiveSet(null)}
        onOpen={() => {}}
        disableSwipeToOpen={true}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <DrawerHandle />
        <Box sx={{ pb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              mb: 3,
              borderBottom: 1,
              borderColor: 'divider',
              pb: 2,
            }}
          >
            <Typography variant="h6" fontWeight="700">
              Set Options
            </Typography>
            <IconButton onClick={() => setActiveSet(null)} size="small">
              <Close />
            </IconButton>
          </Box>

          <Stack spacing={0}>
            <ListItemButton onClick={() => handleChangeSetType('N')} sx={{ px: 3, py: 2 }}>
              <ListItemText
                primary="Normal Set"
                secondary="Standard weight and reps"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {currentActiveSet?.type === 'N' && <Check color="primary" />}
            </ListItemButton>
            <Divider variant="middle" />
            <ListItemButton onClick={() => handleChangeSetType('W')} sx={{ px: 3, py: 2 }}>
              <ListItemText
                primary="Warm Up"
                secondary="Lighter weight to prepare"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {currentActiveSet?.type === 'W' && <Check color="primary" />}
            </ListItemButton>
            <Divider variant="middle" />
            <ListItemButton onClick={() => handleChangeSetType('D')} sx={{ px: 3, py: 2 }}>
              <ListItemText
                primary="Drop Set"
                secondary="Lower weight immediately after"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {currentActiveSet?.type === 'D' && <Check color="primary" />}
            </ListItemButton>
            <Divider variant="middle" />
            <ListItemButton onClick={() => handleChangeSetType('F')} sx={{ px: 3, py: 2 }}>
              <ListItemText
                primary="Failure"
                secondary="Until you can't lift anymore"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {currentActiveSet?.type === 'F' && <Check color="primary" />}
            </ListItemButton>
            <Divider variant="middle" />
            <ListItemButton onClick={handleRemoveSet} sx={{ px: 3, py: 2, color: 'error.main' }}>
              <ListItemText primary="Delete Set" primaryTypographyProps={{ fontWeight: 700 }} />
              <DeleteOutline />
            </ListItemButton>
          </Stack>
        </Box>
      </SwipeableDrawer>

      {/* Reorder Dialog - using dnd-kit */}
      <Dialog
        open={reorderDialogOpen}
        onClose={() => setReorderDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reorder Exercises</DialogTitle>
        <DialogContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={exercises.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <List>
                {exercises.map((exercise) => (
                  <SortableExerciseItem key={exercise.id} id={exercise.id} name={exercise.name} />
                ))}
              </List>
            </SortableContext>
          </DndContext>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReorderDialogOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
