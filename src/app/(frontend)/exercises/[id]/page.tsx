'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  Divider,
  Chip,
} from '@mui/material'
import {
  ArrowBack,
  TrendingUp,
  CalendarToday,
  FitnessCenter,
} from '@mui/icons-material'

export default function ExerciseDetailPage() {
  const router = useRouter()
  const params = useParams()

  // Mock data - would normally fetch based on params.id
  const exercise = {
    id: params.id,
    name: 'Bench Press',
    muscleGroup: 'Chest',
    personalBest: {
      weight: 80,
      reps: 5,
      date: 'January 10, 2026',
    },
    history: [
      { date: 'January 15, 2026', weight: 60, reps: 8, volume: 480, sets: 4 },
      { date: 'January 12, 2026', weight: 65, reps: 6, volume: 390, sets: 4 },
      { date: 'January 10, 2026', weight: 80, reps: 5, volume: 400, sets: 1 },
      { date: 'January 8, 2026', weight: 60, reps: 10, volume: 600, sets: 3 },
      { date: 'January 5, 2026', weight: 55, reps: 10, volume: 550, sets: 3 },
      { date: 'January 3, 2026', weight: 60, reps: 8, volume: 480, sets: 4 },
      { date: 'December 30, 2025', weight: 55, reps: 12, volume: 660, sets: 3 },
      { date: 'December 27, 2025', weight: 50, reps: 10, volume: 500, sets: 3 },
    ],
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#000000',
        pb: 4,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.push('/exercises')}
            sx={{ color: '#ffffff', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
              {exercise.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#888888' }}>
              {exercise.muscleGroup}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Personal Best Card */}
        <Card
          elevation={0}
          sx={{
            bgcolor: '#0a0a0a',
            border: '1px solid #2196F3',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <TrendingUp sx={{ color: '#2196F3', mr: 1, fontSize: '1.25rem' }} />
              <Typography variant="subtitle1" sx={{ color: '#2196F3', fontWeight: 600 }}>
                Personal Best
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 'bold', mr: 0.5 }}>
                {exercise.personalBest.weight}
              </Typography>
              <Typography variant="body1" sx={{ color: '#888888', mr: 2 }}>
                kg
              </Typography>
              <Typography variant="h4" sx={{ color: '#666666', fontWeight: 'bold', mr: 0.5 }}>
                ×
              </Typography>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                {exercise.personalBest.reps}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#666666' }}>
              Set on {exercise.personalBest.date}
            </Typography>
          </CardContent>
        </Card>

        {/* Progress Chart Placeholder */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
            Progress Chart
          </Typography>
          <Card
            sx={{
              bgcolor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: 2,
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: '3rem', color: '#333333', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#666666' }}>
                Chart visualization placeholder
              </Typography>
              <Typography variant="caption" sx={{ color: '#555555' }}>
                Performance over time
              </Typography>
            </Box>
          </Card>
        </Box>

        {/* Historical Performances */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
            Performance History
          </Typography>

          <Card
            sx={{
              bgcolor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: 2,
            }}
          >
            <List sx={{ p: 0 }}>
              {exercise.history.map((entry, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    sx={{
                      px: 2.5,
                      py: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                      <CalendarToday sx={{ fontSize: '0.9rem', color: '#888888', mr: 1 }} />
                      <Typography variant="body2" sx={{ color: '#888888', flex: 1 }}>
                        {entry.date}
                      </Typography>
                      {index === 2 && (
                        <Chip
                          label="PR"
                          size="small"
                          sx={{
                            bgcolor: '#2196F3',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 1 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                          <span style={{ color: '#2196F3' }}>{entry.weight}kg</span> × {entry.reps}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666666' }}>
                          Best set
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ color: '#888888' }}>
                          {entry.sets} sets
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666666' }}>
                          {entry.volume}kg total
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < exercise.history.length - 1 && (
                    <Divider sx={{ bgcolor: '#333333', mx: 2.5 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}
