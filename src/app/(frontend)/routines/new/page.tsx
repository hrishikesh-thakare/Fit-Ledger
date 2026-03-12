'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import apiFetch from '@/lib/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { toKg } from '@/lib/utils/weightConversion'
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
  CircularProgress,
} from '@mui/material'
import { Add, Close, ChevronRight, DeleteOutline, FitnessCenter, Check } from '@mui/icons-material'
import DrawerHandle from '@/components/ui/DrawerHandle'
import PageAppBar from '@/components/PageAppBar'
import { useSnackbar } from '@/hooks/useSnackbar'

import AddCustomExerciseDialog, {
  type CreatedExercise,
} from '@/components/routines/AddCustomExerciseDialog'

type SetType = 'N' | 'W' | 'D'

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
  equipment?: string
  sets: RoutineSet[]
  dbId?: number
}

interface ExerciseOption {
  id: number
  name: string
  bodyPart: string
  equipment?: string
}

// Derive body parts from exercises later

const SET_TYPE_LABELS: { [key in SetType]: string } = {
  N: 'Normal',
  W: 'Warm Up',
  D: 'Drop Set',
}

export default function NewRoutinePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [openExerciseDrawer, setOpenExerciseDrawer] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedBodyPart, setSelectedBodyPart] = useState('All')
  const [selectedEquipment, setSelectedEquipment] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [routineName, setRoutineName] = useState('')
  const [routineNotes, setRoutineNotes] = useState('')

  // API Data
  const [availableExercises, setAvailableExercises] = useState<ExerciseOption[]>([])
  const [bodyParts, setBodyParts] = useState<string[]>(['All'])
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferredUnit, setPreferredUnit] = useState<'kg' | 'lb'>('kg')

  // State for Set Options Drawer
  const [activeSet, setActiveSet] = useState<{ exerciseId: string; setId: string } | null>(null)
  const [customExerciseDialogOpen, setCustomExerciseDialogOpen] = useState(false)

  const { showSnackbar } = useSnackbar()

  // Fetch exercises on mount
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoadingExercises(true)

        // Fetch user's preferred unit
        if (user) {
          const userUnit = user.preferredUnit || 'kg'
          setPreferredUnit(userUnit)
        }

        // Fetch exercises from optimized endpoint
        const exercisesRes = await apiFetch<{ docs: ExerciseOption[] }>('/custom/exercises')
        setAvailableExercises(exercisesRes.docs)

        // Derive body parts from exercises
        const uniqueBodyParts = Array.from(new Set(exercisesRes.docs.map((ex) => ex.bodyPart)))
        setBodyParts(['All', ...uniqueBodyParts.sort()])
      } catch (err) {
        console.error('Error fetching exercises:', err)
        showSnackbar({ message: 'Failed to load exercises', severity: 'error' })
      } finally {
        setLoadingExercises(false)
      }
    }

    fetchExercises()
  }, [user, showSnackbar])

  // Protect against accidental refresh / tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If there are unsaved changes
      if (exercises.length > 0 || routineName.trim().length > 0) {
        // Standard way to show a prompt
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [exercises, routineName])

  const handleAddExercise = (exercise: ExerciseOption) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: exercise.name,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      dbId: exercise.id,
      sets: [{ id: crypto.randomUUID(), type: 'N', weight: '', reps: '' }],
    }
    setExercises((prev) => [...prev, newExercise])
    setOpenExerciseDrawer(false)
  }

  const handleCustomExercise = () => {
    setCustomExerciseDialogOpen(true)
  }

  const handleCustomExerciseAdded = (exercise: CreatedExercise) => {
    showSnackbar({ message: 'Exercise created', severity: 'success' })
    // Add to the available exercises list so it appears in the drawer
    setAvailableExercises((prev) => [
      ...prev,
      { id: Number(exercise.id), name: exercise.name, bodyPart: exercise.bodyPart },
    ])
    // Add muscle group chip if new
    setBodyParts((prev) => (prev.includes(exercise.bodyPart) ? prev : [...prev, exercise.bodyPart]))
    // Immediately add to the routine
    handleAddExercise({ id: Number(exercise.id), name: exercise.name, bodyPart: exercise.bodyPart })
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
      if (ex.equipment) eqs.add(ex.equipment)
    })
    return ['All', ...Array.from(eqs).sort()]
  }, [availableExercises])

  const filteredExercises = useMemo(() => {
    return availableExercises.filter((ex) => {
      const matchesBodyPart = selectedBodyPart === 'All' || ex.bodyPart === selectedBodyPart
      const matchesEquipment = selectedEquipment === 'All' || ex.equipment === selectedEquipment
      const matchesSearch =
        searchQuery.trim() === '' ||
        ex.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      return matchesBodyPart && matchesEquipment && matchesSearch
    })
  }, [selectedBodyPart, selectedEquipment, searchQuery, availableExercises])

  // Helper to find current active set details
  const currentActiveSet = useMemo(() => {
    if (!activeSet) return null
    const exercise = exercises.find((e) => e.id === activeSet.exerciseId)
    return exercise?.sets.find((s) => s.id === activeSet.setId)
  }, [activeSet, exercises])

  // Save Routine to Database
  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      showSnackbar({ message: 'Please enter a routine name', severity: 'error' })
      return
    }

    if (exercises.length === 0) {
      showSnackbar({ message: 'Please add at least one exercise', severity: 'error' })
      return
    }

    try {
      setSaving(true)

      // Use the optimized bulk save endpoint (single Drizzle transaction)
      await apiFetch<{ success: boolean; id: number }>('/custom/routines/new/save', {
        method: 'POST',
        body: JSON.stringify({
          name: routineName,
          description: routineNotes || '',
          exercises: exercises.map((exercise, i) => ({
            exerciseId: String(exercise.dbId),
            order: i,
            sets: exercise.sets.map((set) => ({
              type: set.type,
              weight: set.weight ? String(toKg(parseFloat(set.weight), preferredUnit)) : '0',
              reps: set.reps || '0',
            })),
          })),
        }),
      })

      showSnackbar({ message: 'Routine saved successfully!', severity: 'success' })
      router.replace(`/routines?t=${Date.now()}`)
      router.refresh()
    } catch (err) {
      console.error('Error saving routine:', err)
      showSnackbar({ message: 'Failed to save routine', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

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
      <PageAppBar
        title="Create Routine"
        onBack={() => {
          if (exercises.length > 0 || routineName.trim().length > 0) {
            if (
              window.confirm(
                'You have unsaved changes in your routine. Are you sure you want to go back and lose them?',
              )
            ) {
              router.back()
            }
          } else {
            router.back()
          }
        }}
      />

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
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
                mb: 2,
              }}
            />
            <TextField
              fullWidth
              label="Notes (Optional)"
              placeholder="Add any notes about this routine..."
              variant="outlined"
              multiline
              rows={3}
              value={routineNotes}
              onChange={(e) => setRoutineNotes(e.target.value)}
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
            disabled={saving}
            onClick={handleSaveRoutine}
            sx={{
              py: 1.5,
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Routine'}
          </Button>
        </Container>
      </Box>

      {/* Add Exercise Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={openExerciseDrawer}
        onClose={() => setOpenExerciseDrawer(false)}
        onOpen={() => {
          setOpenExerciseDrawer(true)
          setSelectedBodyPart('All')
          setSelectedEquipment('All')
          setSearchQuery('')
        }}
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
          <Box sx={{ mb: 2, mt: -1.5 }}>
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
          {loadingExercises ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredExercises.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 3,
                gap: 1,
              }}
            >
              <FitnessCenter sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                No exercises found
              </Typography>
              <Typography variant="caption" color="text.disabled" align="center">
                Try a different search or filter
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredExercises.map((exercise) => (
                <React.Fragment key={exercise.id}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handleAddExercise(exercise)}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.4, display: 'block' }}
                        >
                          {exercise.bodyPart}
                        </Typography>
                      </Box>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation()
                          const slug = exercise.name.toLowerCase().replace(/\s+/g, '-')
                          // If there are unsaved changes, prompt first
                          if (exercises.length > 0 || routineName.trim().length > 0) {
                            if (
                              window.confirm(
                                'You have unsaved changes in your routine. Are you sure you want to leave and view exercise stats?',
                              )
                            ) {
                              router.push(`/exercises/${slug}`)
                            }
                          } else {
                            router.push(`/exercises/${slug}`)
                          }
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
          )}
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

      {/* Add Custom Exercise Dialog */}
      <AddCustomExerciseDialog
        open={customExerciseDialogOpen}
        onClose={() => setCustomExerciseDialogOpen(false)}
        onSuccess={handleCustomExerciseAdded}
      />
    </Box>
  )
}
