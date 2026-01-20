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
        bgcolor: '#000000',
        pb: 10,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.back()}
            sx={{ color: '#ffffff', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ color: '#888888', fontSize: '0.75rem' }}>
              Exercise 1 of 6
            </Typography>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
              Bench Press
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3, pb: 10 }}>
        {/* Previous Performance */}
        <Card
          elevation={0}
          sx={{
            bgcolor: '#0a0a0a',
            border: '1px solid #222222',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ color: '#666666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Last workout: 2 days ago
              </Typography>
              <Typography variant="body2" sx={{ color: '#888888' }}>
                4 sets × 60kg × 8 reps
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Sets Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
            Sets
          </Typography>
        </Box>

        {/* Sets List */}
        <Card
          elevation={0}
          sx={{
            bgcolor: '#0a0a0a',
            border: '1px solid #222222',
            borderRadius: 1,
            mb: 2,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                borderBottom: '1px solid #222222',
              }}
            >
              <Box sx={{ width: 40 }}>
                <Typography variant="caption" sx={{ color: '#666666', fontWeight: 600, textTransform: 'uppercase' }}>
                  Set
                </Typography>
              </Box>
              <Box sx={{ flex: 1, px: 1 }}>
                <Typography variant="caption" sx={{ color: '#666666', fontWeight: 600, textTransform: 'uppercase' }}>
                  Kg
                </Typography>
              </Box>
              <Box sx={{ flex: 1, px: 1 }}>
                <Typography variant="caption" sx={{ color: '#666666', fontWeight: 600, textTransform: 'uppercase' }}>
                  Reps
                </Typography>
              </Box>
              <Box sx={{ width: 44 }}>
                <Typography variant="caption" sx={{ color: '#666666', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>
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
                    bgcolor: set.completed ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                  }}
                >
                  {/* Set Number */}
                  <Box sx={{ width: 40 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: set.completed ? '#2196F3' : '#ffffff',
                        fontWeight: 'bold',
                      }}
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
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          bgcolor: '#0a0a0a',
                          minHeight: 44,
                          '& fieldset': {
                            borderColor: '#333333',
                          },
                          '&:hover fieldset': {
                            borderColor: '#2196F3',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#2196F3',
                          },
                        },
                        '& input': {
                          textAlign: 'center',
                          fontSize: '1rem',
                        },
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
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          bgcolor: '#0a0a0a',
                          minHeight: 44,
                          '& fieldset': {
                            borderColor: '#333333',
                          },
                          '&:hover fieldset': {
                            borderColor: '#2196F3',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#2196F3',
                          },
                        },
                        '& input': {
                          textAlign: 'center',
                          fontSize: '1rem',
                        },
                      }}
                    />
                  </Box>

                  {/* Completion Checkbox */}
                  <Box sx={{ width: 50, display: 'flex', justifyContent: 'center' }}>
                    <Checkbox
                      checked={set.completed}
                      onChange={() => handleToggleComplete(set.id)}
                      icon={<RadioButtonUnchecked sx={{ color: '#666666', fontSize: '1.75rem' }} />}
                      checkedIcon={<CheckCircle sx={{ color: '#2196F3', fontSize: '1.75rem' }} />}
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(33, 150, 243, 0.08)',
                        },
                      }}
                    />
                  </Box>
                </Box>
                {index < sets.length - 1 && (
                  <Divider sx={{ bgcolor: '#333333', mx: 2 }} />
                )}
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
          sx={{
            minHeight: 48,
            py: 1.5,
            color: '#2196F3',
            borderColor: '#333333',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            borderRadius: 2,
            mb: 2,
            '&:hover': {
              borderColor: '#2196F3',
              bgcolor: 'rgba(33, 150, 243, 0.08)',
            },
          }}
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
            <Typography variant="h6" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
              {sets.filter(s => s.completed).length}/{sets.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#888888' }}>
              Completed
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
              {sets.reduce((sum, s) => sum + (s.completed && s.weight ? parseFloat(s.weight) * parseInt(s.reps || '0') : 0), 0).toFixed(0)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#888888' }}>
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
          bgcolor: '#0a0a0a',
          borderTop: '1px solid #1a1a1a',
          p: 2,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleFinishWorkout}
          sx={{
            py: 1.75,
            bgcolor: '#2196F3',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1.1rem',
            textTransform: 'none',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
            '&:hover': {
              bgcolor: '#1976D2',
              boxShadow: '0 6px 16px rgba(33, 150, 243, 0.5)',
            },
          }}
        >
          Finish Workout
        </Button>
      </Box>
    </Box>
  )
}
