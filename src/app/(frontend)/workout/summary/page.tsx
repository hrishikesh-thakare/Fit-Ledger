'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  AppBar,
  Toolbar,
  Button,
  List,
  ListItem,
  Divider,
  Stack,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'

export default function WorkoutSummaryPage() {
  const router = useRouter()
  const [updatePrevWeights, setUpdatePrevWeights] = useState(true)
  const [openDiscardDialog, setOpenDiscardDialog] = useState(false)

  const workoutData = {
    duration: '45:32',
    totalVolume: 4250,
    exercises: [
      { id: 1, name: 'Bench Press', sets: 4, reps: 32, weight: '60kg', volume: 1920 },
      { id: 2, name: 'Incline Dumbbell Press', sets: 3, reps: 30, weight: '22.5kg', volume: 675 },
      { id: 3, name: 'Shoulder Press', sets: 4, reps: 40, weight: '20kg', volume: 800 },
      { id: 4, name: 'Lateral Raises', sets: 3, reps: 36, weight: '12.5kg', volume: 450 },
      { id: 5, name: 'Tricep Pushdowns', sets: 3, reps: 36, weight: '15kg', volume: 540 },
    ],
  }

  const handleSave = () => {
    // Logic to save workout and optionally update previous weights
    console.log('Saving workout, update weights:', updatePrevWeights)
    router.push('/dashboard')
  }

  const handleDiscard = () => {
    setOpenDiscardDialog(true)
  }

  const handleConfirmDiscard = () => {
    setOpenDiscardDialog(false)
    router.push('/dashboard')
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
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              fontSize: '1rem',
              flexGrow: 1,
            }}
          >
            Workout Complete
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Good Job! 🎉
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You crushed your chest day session.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Card
            elevation={0}
            sx={{
              flex: 1,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 800, mb: 0 }}>
              {workoutData.duration}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}
            >
              Duration
            </Typography>
          </Card>

          <Card
            elevation={0}
            sx={{
              flex: 1,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 800, mb: 0 }}>
              {workoutData.totalVolume}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}
            >
              Volume (kg)
            </Typography>
          </Card>
        </Box>

        {/* Exercises Summary */}
        <Stack spacing={2} sx={{ mb: 4 }}>
          {workoutData.exercises.map((exercise, index) => (
            <Card
              key={exercise.id}
              elevation={0}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: 'surfaceContainerHighest',
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                  }}
                >
                  {index + 1}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {exercise.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {exercise.sets} sets • {exercise.weight} best
                  </Typography>
                </Box>
              </Box>
            </Card>
          ))}
        </Stack>

        {/* Settings & Actions */}
        <Box sx={{ mb: 3 }}>
          <Card
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              mb: 3,
              p: 2,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={updatePrevWeights}
                  onChange={(e) => setUpdatePrevWeights(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'primary.main',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'primary.main',
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Update Previous Weights
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sync last performed weights to new workouts
                  </Typography>
                </Box>
              }
              sx={{
                width: '100%',
                ml: 0,
                justifyContent: 'space-between',
                flexDirection: 'row-reverse',
                m: 0,
              }}
            />
          </Card>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSave}
            sx={{
              py: 1.5,
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: 2,
              mb: 2,
            }}
          >
            Save Workout
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="text"
              color="error"
              size="large"
              onClick={handleDiscard}
              sx={{
                fontWeight: 600,
                px: 4,
                borderRadius: 2,
              }}
            >
              Discard Workout
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Discard Confirmation Dialog */}
      <Dialog
        open={openDiscardDialog}
        onClose={() => setOpenDiscardDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3, bgcolor: 'background.paper', m: 2 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Discard Workout?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary' }}>
            Are you sure you want to discard this workout? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setOpenDiscardDialog(false)}
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDiscard}
            color="error"
            variant="contained"
            disableElevation
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
