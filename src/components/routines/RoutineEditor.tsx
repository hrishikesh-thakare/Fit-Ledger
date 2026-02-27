'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import apiFetch from '@/lib/api/client'
import { saveRoutine } from '@/lib/api/routines'
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
  DialogActions,
} from '@mui/material'
import {
  Add,
  Close,
  ChevronRight,
  DeleteOutline,
  FitnessCenter,
  Check,
  MoreVert,
} from '@mui/icons-material'
import DrawerHandle from '@/components/ui/DrawerHandle'
import PageAppBar from '@/components/PageAppBar'
import { useSnackbar } from '@/hooks/useSnackbar'
import AddCustomExerciseDialog, { type CreatedExercise } from '@/components/routines/AddCustomExerciseDialog'

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
} from '@dnd-kit/sortable'

type SetType = 'N' | 'W' | 'D'

interface RoutineSet {
  id: string
  type: SetType
  weight: string
  reps: string
}

interface Exercise {
  id: string
  exerciseDefId: string
  name: string
  bodyPart?: string
  sets: RoutineSet[]
}

const SET_TYPE_LABELS: { [key in SetType]: string } = {
  N: 'Normal',
  W: 'Warm Up',
  D: 'Drop Set',
}

interface RoutineEditorProps {
  routineId: string
}

export default function RoutineEditor({ routineId }: RoutineEditorProps) {
  const router = useRouter()
  const { showSnackbar } = useSnackbar()

  const [openExerciseDrawer, setOpenExerciseDrawer] = useState(false)
  const [selectedBodyPart, setSelectedBodyPart] = useState('All')
  const [selectedEquipment, setSelectedEquipment] = useState('All')

  // State for Set Options Drawer
  const [activeSet, setActiveSet] = useState<{ exerciseId: string; setId: string } | null>(null)

  // Menu & Dialog State
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [customExerciseDialogOpen, setCustomExerciseDialogOpen] = useState(false)

  // Fetch Data State
  const [availableExercises, setAvailableExercises] = useState<{ id: string | number; name: string; muscleGroup?: { name: string }; equipment?: string[] }[]>([])
  const [muscleGroups, setMuscleGroups] = useState<string[]>(['All'])
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize with empty State
  const [routineName, setRoutineName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])

  // Fetch Exercises and Muscle Groups
  const fetchOptions = React.useCallback(async () => {
    try {
      const [exercisesRes, muscleGroupsRes] = await Promise.all([
        apiFetch<{ docs: { id: string | number; name: string; muscleGroup?: { name: string }; equipment?: string[] }[] }>('/exercises?limit=500&depth=1'), // Fetch all exercises
        apiFetch<{ docs: { id: string | number; name: string }[] }>('/muscle-groups?limit=100'),
      ])

      setAvailableExercises(exercisesRes.docs || [])

      const groups = muscleGroupsRes.docs.map((g: { name: string }) => g.name)
      setMuscleGroups(['All', ...groups])
    } catch (error) {
      console.error('Failed to fetch options', error)
      showSnackbar({ message: 'Failed to load exercises', severity: 'error' })
    }
  }, [showSnackbar])

  React.useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  // Fetch Existing Routine if editing
  const fetchRoutineConfig = React.useCallback(async () => {
    if (routineId === 'new') return

    try {
      // 1. Fetch Routine Info
      const routineData = await apiFetch<{ name: string }>(`/routines/${routineId}`)
      setRoutineName(routineData.name)

      // 2. Fetch Routine Exercises
      const exercisesData = await apiFetch<{ docs: { id: string; exercise: { id: string; name: string; muscleGroup?: { name: string } } | string }[] }>(
        `/routine-exercises?where[routine][equals]=${routineId}&depth=1&sort=exerciseOrder`,
      )

      // 3. Fetch Routine Sets (for all exercises)
      const routineExerciseIds = exercisesData.docs.map((re: { id: string }) => re.id)
      let setsData: { id: string; routineExercise: string | { id: string }; setOrder: number; setLabel?: string; weight?: number; reps?: number }[] = []

      if (routineExerciseIds.length > 0) {
        const setsParams = new URLSearchParams()
        routineExerciseIds.forEach((id: string, index: number) => {
          setsParams.append(`where[routineExercise][in][${index}]`, id)
        })
        setsParams.append('limit', '300')
        setsParams.append('sort', 'setOrder')

        const setsRes = await apiFetch<{ docs: typeof setsData }>(`/routine-sets?${setsParams.toString()}`)
        setsData = setsRes.docs
      }

      // 4. Map to State
      const formattedExercises = exercisesData.docs.map((re: { id: string; exercise: { id: string; name: string; muscleGroup?: { name: string } } | string }) => {
        const exerciseSets = setsData
          .filter(
            (s) =>
              (typeof s.routineExercise === 'string' ? s.routineExercise : s.routineExercise.id) ===
              re.id,
          )
          .sort((a, b) => a.setOrder - b.setOrder)

        return {
          id: re.id,
          exerciseDefId: typeof re.exercise === 'object' ? re.exercise.id : re.exercise,
          name: typeof re.exercise === 'object' ? re.exercise.name : 'Unknown Exercise',
          bodyPart:
            typeof re.exercise === 'object' && re.exercise.muscleGroup
              ? re.exercise.muscleGroup.name
              : '',
          sets: exerciseSets.map((s) => ({
            id: s.id,
            type: (s.setLabel === 'warmup'
              ? 'W'
              : s.setLabel === 'drop'
                ? 'D'
                : 'N') as SetType,
            weight: s.weight?.toString() || '',
            reps: s.reps?.toString() || '',
          })),
        }
      })

      setExercises(formattedExercises)
    } catch (_error) {
      console.error(_error)
      showSnackbar({ message: 'Failed to load routine data', severity: 'error' })
    }
  }, [routineId, showSnackbar])

  React.useEffect(() => {
    fetchRoutineConfig()
  }, [fetchRoutineConfig])

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

  const handleAddExercise = (exercise: { id: string | number; name: string; muscleGroup?: { name: string } }) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      exerciseDefId: String(exercise.id),
      name: exercise.name,
      bodyPart: exercise.muscleGroup?.name || '',
      sets: [{ id: crypto.randomUUID(), type: 'N', weight: '', reps: '' }],
    }
    setExercises((prev) => [...prev, newExercise])
    setOpenExerciseDrawer(false)
  }

  const handleCustomExercise = () => {
    setCustomExerciseDialogOpen(true)
  }

  const handleCustomExerciseAdded = (exercise: CreatedExercise) => {
    // Add to available exercises list so it shows up in the drawer filter
    setAvailableExercises((prev) => [
      ...prev,
      { id: exercise.id, name: exercise.name, muscleGroup: { name: exercise.bodyPart } },
    ])
    // Add muscle group chip if not already present
    setMuscleGroups((prev) =>
      prev.includes(exercise.bodyPart) ? prev : [...prev, exercise.bodyPart],
    )
    // Immediately add the exercise to the routine and close the drawer
    handleAddExercise({ id: exercise.id, name: exercise.name, muscleGroup: { name: exercise.bodyPart } })
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
    if (!routineName.trim()) {
      showSnackbar({ message: 'Routine name is required', severity: 'error' })
      return
    }

    try {
      const savedRoutineId = await saveRoutine({
        id: routineId,
        name: routineName,
        exercises: exercises.map((ex, idx) => ({
          id: ex.id,
          exerciseId: ex.exerciseDefId,
          order: idx,
          sets: ex.sets.map((s) => ({
            id: s.id,
            type: s.type,
            weight: s.weight,
            reps: s.reps,
          })),
        })),
      })

      showSnackbar({ message: 'Routine saved successfully', severity: 'success' })

      // Navigate
      if (savedRoutineId) {
        router.replace(`/routines/${savedRoutineId}?t=${Date.now()}`)
      } else {
        router.replace(`/routines?t=${Date.now()}`)
      }
      router.refresh()
    } catch (_saveError) {
      showSnackbar({ message: 'Failed to save routine', severity: 'error' })
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

  const equipmentOptions = useMemo(() => {
    const eqs = new Set<string>()
    availableExercises.forEach((ex) => {
      if (Array.isArray(ex.equipment)) ex.equipment.forEach((e: string) => eqs.add(e))
    })
    return ['All', ...Array.from(eqs).sort()]
  }, [availableExercises])

  const filteredExercises = useMemo(() => {
    return availableExercises.filter((ex) => {
      const matchesBodyPart =
        selectedBodyPart === 'All' || ex.muscleGroup?.name === selectedBodyPart
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesEquipment =
        selectedEquipment === 'All' ||
        (Array.isArray(ex.equipment) && ex.equipment.includes(selectedEquipment))
      return matchesBodyPart && matchesSearch && matchesEquipment
    })
  }, [selectedBodyPart, availableExercises, searchQuery, selectedEquipment])

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

    // Count how many 'N' sets appear before this one
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
      <PageAppBar
        title={routineId === 'new' ? 'Create Routine' : 'Edit Routine'}
        onBack={() => router.back()}
        actions={
          <>
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={exercises} strategy={verticalListSortingStrategy}>
                    {exercises.map((exercise, _index) => (
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
                            {/* TODO: Drag Handle Implementation inside Card Header or separate SortableItem wrapper */}
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
                  </SortableContext>
                </DndContext>
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
            {routineId === 'new' ? 'Create Routine' : 'Update Routine'}
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

          {/* Search Box */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                  borderRadius: 2,
                },
              }}
            />
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
            {muscleGroups.map((part) => (
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
                        {exercise.muscleGroup?.name}
                      </Typography>
                      {Array.isArray(exercise.equipment) && exercise.equipment.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {exercise.equipment.map((eq: string) => (
                            <Chip
                              key={eq}
                              label={eq.replace('_', ' ')}
                              size="small"
                              variant="outlined"
                              sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation()
                        // const slug = exercise.name.toLowerCase().replace(/\s+/g, '-')
                        // router.push(`/exercises/${slug}`)
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
      </SwipeableDrawer>

      {/* Reorder Dialog (Placeholder) */}
      <Dialog open={reorderDialogOpen} onClose={() => setReorderDialogOpen(false)}>
        <DialogTitle>Reorder Exercises</DialogTitle>
        <DialogContent>
          <Typography>
            Drag and drop reordering logic using dnd-kit is enabled in the main list. This dialog is
            just a placeholder action.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReorderDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Custom Exercise Dialog */}
      <AddCustomExerciseDialog
        open={customExerciseDialogOpen}
        onClose={() => setCustomExerciseDialogOpen(false)}
        onSuccess={handleCustomExerciseAdded}
      />
    </Box>
  )
}
