'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Checkbox,
  Divider,
  Stack,
} from '@mui/material'
import {
  ArrowBack,
  Add,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material'

export default function WorkoutLoggingPage() {
  const router = useRouter()

  const [sets, setSets] = useState([
    { id: 1, weight: '60', reps: '8', completed: true },
    { id: 2, weight: '60', reps: '8', completed: true },
    { id: 3, weight: '60', reps: '8', completed: false },
    { id: 4, weight: '', reps: '', completed: false },
  ])

  const handleAddSet = () => {
    const newSet = {
      id: sets.length + 1,
      weight: sets.length > 0 ? sets[sets.length - 1].weight : '',
      reps: sets.length > 0 ? sets[sets.length - 1].reps : '',
      completed: false,
    }
    setSets([...sets, newSet])
  }

  const handleSetChange = (id: number, field: 'weight' | 'reps', value: string) => {
    setSets(sets.map(set => set.id === id ? { ...set, [field]: value } : set))
  }

  const handleToggleComplete = (id: number) => {
    setSets(sets.map(set => set.id === id ? { ...set, completed: !set.completed } : set))
  }

  const handleFinishWorkout = () => {
    router.push('/workout/summary')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 10,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="labelSmall" color="text.secondary">
              Exercise 1 of 6
            </Typography>
            <Typography variant="titleLarge" fontWeight="bold">
              Bench Press
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3, pb: 10 }}>
        {/* Previous Performance */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={0.5}>
              <Typography variant="labelMedium" color="text.disabled" sx={{ textTransform: 'uppercase' }}>
                Last workout: 2 days ago
              </Typography>
              <Typography variant="bodyMedium" color="text.secondary">
                4 sets × 60kg × 8 reps
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Sets Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="titleLarge" fontWeight="bold" sx={{ mb: 2 }}>
            Sets
          </Typography>
        </Box>

        {/* Sets List */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ width: 40 }}>
                <Typography variant="labelMedium" color="text.disabled" sx={{ textTransform: 'uppercase' }}>
                  Set
                </Typography>
              </Box>
              <Box sx={{ flex: 1, px: 1 }}>
                <Typography variant="labelMedium" color="text.disabled" sx={{ textTransform: 'uppercase' }}>
                  Kg
                </Typography>
              </Box>
              <Box sx={{ flex: 1, px: 1 }}>
                <Typography variant="labelMedium" color="text.disabled" sx={{ textTransform: 'uppercase' }}>
                  Reps
                </Typography>
              </Box>
              <Box sx={{ width: 44 }}>
                <Typography variant="labelMedium" color="text.disabled" sx={{ textTransform: 'uppercase', textAlign: 'center' }}>
                  Done
                </Typography>
              </Box>
            </Box>

            {/* Sets */}
            {sets.map((set, index) => (
              <React.Fragment key={set.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    bgcolor: set.completed ? 'action.selected' : 'transparent',
                  }}
                >
                  {/* Set Number */}
                  <Box sx={{ width: 40 }}>
                    <Typography
                      variant="bodyLarge"
                      color={set.completed ? 'primary.main' : 'text.primary'}
                      fontWeight="bold"
                    >
                      {index + 1}
                    </Typography>
                  </Box>

                  {/* Weight Input */}
                  <Box sx={{ flex: 1, px: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={set.weight}
                      onChange={(e) => handleSetChange(set.id, 'weight', e.target.value)}
                      placeholder="0"
                      inputProps={{
                        inputMode: 'decimal',
                        min: 0,
                        style: { textAlign: 'center' },
                      }}
                    />
                  </Box>

                  {/* Reps Input */}
                  <Box sx={{ flex: 1, px: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={set.reps}
                      onChange={(e) => handleSetChange(set.id, 'reps', e.target.value)}
                      placeholder="0"
                      inputProps={{
                        inputMode: 'numeric',
                        min: 0,
                        style: { textAlign: 'center' },
                      }}
                    />
                  </Box>

                  {/* Completion Checkbox */}
                  <Box sx={{ width: 50, display: 'flex', justifyContent: 'center' }}>
                    <Checkbox
                      checked={set.completed}
                      onChange={() => handleToggleComplete(set.id)}
                      icon={<RadioButtonUnchecked />}
                      checkedIcon={<CheckCircle color="primary" />}
                    />
                  </Box>
                </Box>
                {index < sets.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>

        {/* Add Set Button */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAddSet}
          sx={{ mb: 2 }}
        >
          Add Set
        </Button>

        {/* Stats */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            px: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="titleLarge" color="primary.main" fontWeight="bold">
              {sets.filter(s => s.completed).length}/{sets.length}
            </Typography>
            <Typography variant="labelMedium" color="text.secondary">
              Completed
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="titleLarge" color="primary.main" fontWeight="bold">
              {sets.reduce((sum, s) => sum + (s.completed && s.weight ? parseFloat(s.weight) * parseInt(s.reps || '0') : 0), 0).toFixed(0)}
            </Typography>
            <Typography variant="labelMedium" color="text.secondary">
              Total Volume
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* Sticky Bottom Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'surfaceContainerLow',
          borderTop: 1,
          borderColor: 'divider',
          p: 2,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleFinishWorkout}
        >
          Finish Workout
        </Button>
      </Box>
    </Box>
  )
}
