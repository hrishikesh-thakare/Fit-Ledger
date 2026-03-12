'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toKg, formatWeight } from '@/lib/utils/weightConversion'
import apiFetch from '@/lib/api/client'
import type { User } from '@/payload-types'
import {
  Box,
  Container,
  Typography,
  IconButton,
  Button,
  Card,
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
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Skeleton,
  Fade,
} from '@mui/material'
import {
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
import PageAppBar from '@/components/PageAppBar'
import { useSnackbar } from '@/hooks/useSnackbar'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'
import {
  fetchRoutineDetails,
  fetchExercises,
  saveRoutine,
  type AvailableExercise,
} from '@/lib/api/routines'
import AddCustomExerciseDialog, {
  type CreatedExercise,
} from '@/components/routines/AddCustomExerciseDialog'

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

type SetType = 'N' | 'W' | 'D'

interface RoutineSet {
  id: string
  type: SetType
  weight: string
  reps: string
}

interface Exercise {
  id: string
  exerciseId?: string // The actual Exercise ID from the database
  name: string
  bodyPart?: string
  equipment?: string
  sets: RoutineSet[]
  dbId?: number
}

// Body parts will be derived from exercises

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
  const { user } = useAuth()
  const { isActive: _isWorkoutActive } = useWorkoutSession()

  const [openExerciseDrawer, setOpenExerciseDrawer] = useState(false)
  const [selectedBodyPart, setSelectedBodyPart] = useState('All')
  const [selectedEquipment, setSelectedEquipment] = useState('All')
  const [preferredUnit, setPreferredUnit] = useState<'kg' | 'lb'>('kg')

  // State for Set Options Drawer
  const [activeSet, setActiveSet] = useState<{ exerciseId: string; setId: string } | null>(null)

  // Menu & Dialog State
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [customExerciseDialogOpen, setCustomExerciseDialogOpen] = useState(false)

  // Data states
  const [routineName, setRoutineName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [availableExercises, setAvailableExercises] = useState<AvailableExercise[]>([])

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const routineId = params.id as string
        const userId = user?.id

        // Fetch routine details, available exercises, and user profile in parallel
        const [routineData, exercisesData, userProfile] = await Promise.all([
          fetchRoutineDetails(routineId),
          fetchExercises(),
          userId ? apiFetch<User>(`/users/${userId}`) : null,
        ])

        const userUnit: 'kg' | 'lb' = userProfile?.preferredUnit || 'kg'
        setPreferredUnit(userUnit)

        // Set routine data
        setRoutineName(routineData.name)

        // Map exercises to UI format and convert weights from kg to user's unit
        const mappedExercises: Exercise[] = routineData.exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          bodyPart: ex.bodyPart,
          equipment: ex.equipment,
          exerciseId: ex.exerciseId,
          dbId: ex.exerciseId ? Number(ex.exerciseId) : undefined,
          sets: ex.sets.map((set) => ({
            id: set.id,
            type: set.type,
            weight: set.weight ? formatWeight(parseFloat(set.weight), userUnit) : set.weight,
            reps: set.reps,
          })),
        }))

        setExercises(mappedExercises)
        setAvailableExercises(exercisesData)
      } catch (err: unknown) {
        console.error('Error loading routine:', err)
        setError(err instanceof Error ? err.message : 'Failed to load routine')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id, user?.id])

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

  const { showSnackbar } = useSnackbar()

  const handleAddExercise = (exercise: AvailableExercise) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      name: exercise.name,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      dbId: Number(exercise.id),
      sets: [{ id: crypto.randomUUID(), type: 'N', weight: '', reps: '' }],
    }
    setExercises((prev) => [...prev, newExercise])
    setOpenExerciseDrawer(false)
  }

  const handleCustomExercise = () => {
    setCustomExerciseDialogOpen(true)
  }

  const handleCustomExerciseAdded = (exercise: CreatedExercise) => {
    // Add to the available exercises list so it appears in the drawer and chips
    setAvailableExercises((prev) => [
      ...prev,
      { id: exercise.id, name: exercise.name, bodyPart: exercise.bodyPart },
    ])
    // Immediately add to the routine
    handleAddExercise({ id: exercise.id, name: exercise.name, bodyPart: exercise.bodyPart })
  }

  const handleRemoveExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id))
  }

  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        // Auto-fill from previous set if exists
        const lastSet = ex.sets[ex.sets.length - 1]
        const newSet: RoutineSet = {
          id: crypto.randomUUID(),
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

        const newSets = ex.sets.map((s) => {
          if (s.id === setId) {
            return { ...s, [field]: value }
          }
          return s
        })

        // If we updated the first set's weight or reps, propagate to all other sets
        const isFirstSet = newSets.length > 0 && newSets[0].id === setId
        if (isFirstSet && (field === 'weight' || field === 'reps')) {
          return {
            ...ex,
            sets: newSets.map((s, index) => {
              if (index === 0) return s
              return { ...s, [field]: value }
            }),
          }
        }

        return { ...ex, sets: newSets }
      }),
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const routineId = params.id as string

      // Validate that all exercises have an exerciseId
      const invalidExercises = exercises.filter((ex) => !ex.exerciseId)
      if (invalidExercises.length > 0) {
        throw new Error('Some exercises are missing required data. Please remove and re-add them.')
      }

      // Map exercises to API format and convert weights to kg
      const exercisesToSave = exercises.map((ex, index) => ({
        id: ex.id,
        exerciseId: ex.exerciseId!,
        sets: ex.sets.map((set) => ({
          ...set,
          weight: set.weight ? String(toKg(parseFloat(set.weight), preferredUnit)) : set.weight,
        })),
        order: index,
      }))

      await saveRoutine({
        id: routineId,
        name: routineName,
        description: '',
        exercises: exercisesToSave,
      })

      showSnackbar({
        message: 'Routine updated successfully',
        severity: 'success',
      })

      router.replace(`/routines/${routineId}?t=${Date.now()}`)
      router.refresh()
    } catch (err: unknown) {
      console.error('Error saving routine:', err)
      setError(err instanceof Error ? err.message : 'Failed to save routine')
      showSnackbar({
        message: 'Failed to save routine',
        severity: 'error',
      })
    } finally {
      setSaving(false)
    }
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

  // Derive body parts from available exercises
  const bodyParts = useMemo(() => {
    const parts = new Set<string>()
    availableExercises.forEach((ex) => parts.add(ex.bodyPart))
    return ['All', ...Array.from(parts).sort()]
  }, [availableExercises])

  const equipmentOptions = useMemo(() => {
    const eqs = new Set<string>()
    availableExercises.forEach((ex) => {
      if (ex.equipment) eqs.add(ex.equipment)
    })
    return ['All', ...Array.from(eqs).sort()]
  }, [availableExercises])

  const filteredExercises = useMemo(() => {
    return availableExercises.filter((ex) => {
      const matchesBodyPart = selectedBodyPart === 'All' || ex.bodyPart === selectedBodyPart
      const matchesEquipment =
        selectedEquipment === 'All' ||
        ex.equipment === selectedEquipment
      return matchesBodyPart && matchesEquipment
    })
  }, [selectedBodyPart, selectedEquipment, availableExercises])

  const _appBarHeight = 64

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

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const handleDeleteRoutine = () => {
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteRoutine = async () => {
    setDeleteConfirmOpen(false)
    try {
      const routineId = params.id as string
      await apiFetch(`/routines/${routineId}`, {
        method: 'DELETE',
      })

      showSnackbar({
        message: 'Routine deleted successfully',
        severity: 'success',
      })

      router.push('/routines')
    } catch (err: unknown) {
      console.error('Error deleting routine:', err)
      showSnackbar({
        message: 'Failed to delete routine',
        severity: 'error',
      })
    }
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
      <PageAppBar
        title="Edit Routine"
        onBack={() => router.back()}
        actions={
          <>
            <IconButton onClick={handleDeleteRoutine} sx={{ mr: 1, color: 'error.main' }}>
              <DeleteOutline />
            </IconButton>
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
          </>
        }
      />

      {/* Content Area */}
      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {loading ? (
          <Box>
            {/* Routine Name Skeleton */}
            <Box sx={{ px: 1, mb: 3 }}>
              <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            </Box>

            {/* Exercises Section Header Skeleton */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5,
                px: 1,
              }}
            >
              <Skeleton variant="text" width={100} height={24} />
              <Skeleton variant="rectangular" width={140} height={36} sx={{ borderRadius: 1 }} />
            </Box>

            {/* Exercise Cards Skeleton */}
            <Stack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  elevation={1}
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  {/* Exercise Header */}
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width="30%" height={18} />
                      </Box>
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </Box>

                  {/* Sets Table Skeleton */}
                  <Box sx={{ p: 2 }}>
                    {[1, 2, 3].map((j) => (
                      <Box key={j} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton variant="text" width={80} />
                        <Skeleton variant="text" width={80} />
                        <Skeleton variant="circular" width={32} height={32} />
                      </Box>
                    ))}
                    <Skeleton
                      variant="rectangular"
                      width={120}
                      height={36}
                      sx={{ borderRadius: 1, mt: 1 }}
                    />
                  </Box>
                </Card>
              ))}
            </Stack>
          </Box>
        ) : (
          <Fade in timeout={400}>
            <Box>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
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
                      {exercises.map((exercise) => (
                        <Card
                          key={exercise.id}
                          elevation={1}
                          sx={{
                            bgcolor: 'background.paper',
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
                              borderBottom: 1,
                              borderColor: 'divider',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {exercise.name}
                              </Typography>
                              {exercise.equipment && (
                                <Chip
                                  label={exercise.equipment.replace('_', ' ')}
                                  size="small"
                                  variant="filled"
                                  color="secondary"
                                  sx={{
                                    textTransform: 'capitalize',
                                    fontSize: '0.65rem',
                                    height: 18,
                                    lineHeight: 1,
                                  }}
                                />
                              )}
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
                                    {preferredUnit}
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
                                        variant="text"
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
                                          fontSize: '0.875rem',
                                          color:
                                            set.type === 'N'
                                              ? 'text.secondary'
                                              : set.type === 'W'
                                                ? 'warning.main'
                                                : set.type === 'D'
                                                  ? 'info.main'
                                                  : 'error.main',
                                          bgcolor: 'transparent',
                                          '&:hover': {
                                            bgcolor: 'action.hover',
                                          },
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
                                          handleUpdateSet(
                                            exercise.id,
                                            set.id,
                                            'weight',
                                            e.target.value,
                                          )
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
                                          handleUpdateSet(
                                            exercise.id,
                                            set.id,
                                            'reps',
                                            e.target.value,
                                          )
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
            </Box>
          </Fade>
        )}
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
            disabled={saving || !routineName.trim()}
            sx={{
              py: 1.5,
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            {saving ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Update Routine'
            )}
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
            <Box>
              <IconButton onClick={handleCustomExercise} size="small" sx={{ mr: 1 }}>
                <Add />
              </IconButton>
              <IconButton onClick={() => setOpenExerciseDrawer(false)} size="small">
                <Close />
              </IconButton>
            </Box>
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
            {bodyParts.map((part) => (
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

          {/* Horizontal Equipment Filter */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              pb: 1,
              mt: 1,
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {equipmentOptions.map((eq) => (
              <Chip
                key={eq}
                label={eq === 'All' ? 'All' : eq.replace('_', ' ')}
                onClick={() => setSelectedEquipment(eq)}
                color={selectedEquipment === eq ? 'secondary' : 'default'}
                variant={selectedEquipment === eq ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
              />
            ))}
          </Box>
        </Box>

        {/* Exercises List */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          <List>
            {filteredExercises.map((exercise) => (
              <React.Fragment key={exercise.id}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleAddExercise(exercise)}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {exercise.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {exercise.bodyPart}
                      </Typography>
                      {exercise.equipment && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          <Chip
                            label={exercise.equipment!.replace('_', ' ')}
                            size="small"
                            variant="filled"
                            color="secondary"
                            sx={{
                              textTransform: 'capitalize',
                              fontSize: '0.65rem',
                              height: 18,
                              lineHeight: 1,
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation()
                        const slug = exercise.name.toLowerCase().replace(/\s+/g, '-')
                        router.push(`/exercises/${slug}`)
                      }}
                    >
                      <ChevronRight color="action" />
                    </IconButton>
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
              <ListItemText primary="Normal Set" primaryTypographyProps={{ fontWeight: 600 }} />
              {currentActiveSet?.type === 'N' && <Check color="primary" />}
            </ListItemButton>
            <Divider variant="middle" />
            <ListItemButton onClick={() => handleChangeSetType('W')} sx={{ px: 3, py: 2 }}>
              <ListItemText primary="Warm Up" primaryTypographyProps={{ fontWeight: 600 }} />
              {currentActiveSet?.type === 'W' && <Check color="primary" />}
            </ListItemButton>
            <Divider variant="middle" />
            <ListItemButton onClick={() => handleChangeSetType('D')} sx={{ px: 3, py: 2 }}>
              <ListItemText primary="Drop Set" primaryTypographyProps={{ fontWeight: 600 }} />
              {currentActiveSet?.type === 'D' && <Check color="primary" />}
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

      {/* Add Custom Exercise Dialog */}
      <AddCustomExerciseDialog
        open={customExerciseDialogOpen}
        onClose={() => setCustomExerciseDialogOpen(false)}
        onSuccess={handleCustomExerciseAdded}
      />

      {/* Delete Routine Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Routine?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this routine? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteRoutine}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
