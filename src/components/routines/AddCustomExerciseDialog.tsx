'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  FormHelperText,
  Box,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material'
import apiFetch from '@/lib/api/client'

interface MuscleGroup {
  id: string | number
  name: string
}

const EQUIPMENT_OPTIONS = [
  { label: 'Barbell', value: 'barbell' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Machine', value: 'machine' },
  { label: 'Cable', value: 'cable' },
  { label: 'Smith Machine', value: 'smith_machine' },
  { label: 'Bodyweight', value: 'bodyweight' },
] as const

export interface CreatedExercise {
  id: string
  name: string
  bodyPart: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (exercise: CreatedExercise) => void
}

export default function AddCustomExerciseDialog({ open, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [muscleGroupId, setMuscleGroupId] = useState('')
  const [equipment, setEquipment] = useState<string>('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    muscleGroup?: string
    submit?: string
  }>({})

  // Fetch muscle groups when dialog opens
  useEffect(() => {
    if (!open) return
    let active = true
    ;(async () => {
      setLoadingGroups(true)
      try {
        const res = await apiFetch<{ docs: MuscleGroup[] }>('/muscle-groups?limit=100&sort=name')
        if (active) setMuscleGroups(res.docs)
      } catch {
        // ignore – user will see empty dropdown
      } finally {
        if (active) setLoadingGroups(false)
      }
    })()
    return () => {
      active = false
    }
  }, [open])

  const reset = () => {
    setName('')
    setMuscleGroupId('')
    setEquipment('')
    setIsPrivate(true)
    setErrors({})
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Exercise name is required'
    else if (name.trim().length > 50) e.name = 'Name must be 50 characters or less'
    if (!muscleGroupId) e.muscleGroup = 'Muscle group is required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }

    setSubmitting(true)
    setErrors({})
    try {
      const res = await apiFetch<{ doc: CreatedExercise }>('/custom/exercises', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          muscleGroupId,
          equipment: equipment || undefined,
          isCustom: isPrivate,
        }),
      })
      onSuccess(res.doc)
      handleClose()
    } catch (err: unknown) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to create exercise. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Create Custom Exercise</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Exercise Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            autoFocus
            inputProps={{ maxLength: 50 }}
          />

          <FormControl fullWidth error={!!errors.muscleGroup}>
            <InputLabel>Muscle Group</InputLabel>
            <Select
              value={muscleGroupId}
              label="Muscle Group"
              onChange={(e) => {
                setMuscleGroupId(e.target.value)
                setErrors((prev) => ({ ...prev, muscleGroup: undefined }))
              }}
              disabled={loadingGroups}
            >
              {loadingGroups ? (
                <MenuItem disabled>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Loading…
                </MenuItem>
              ) : (
                muscleGroups.map((g) => (
                  <MenuItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.muscleGroup && <FormHelperText>{errors.muscleGroup}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Equipment</InputLabel>
            <Select
              value={equipment}
              label="Equipment"
              onChange={(e) => setEquipment(e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {EQUIPMENT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {errors.submit && <FormHelperText error>{errors.submit}</FormHelperText>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <FormControlLabel
              control={
                <Switch checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
              }
              label="Custom exercise (only visible to me)"
            />
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
              {isPrivate ? 'Only you can see and use this exercise' : 'Shared with all users'}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ fontWeight: 700, minWidth: 80 }}
        >
          {submitting ? <CircularProgress size={18} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
