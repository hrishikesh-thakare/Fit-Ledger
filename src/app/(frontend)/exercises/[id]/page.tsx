'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Toolbar,
  IconButton,
  List,
  ListItem,
  Divider,
  Chip,
} from '@mui/material'
import { ArrowBack, TrendingUp, CalendarToday } from '@mui/icons-material'
import AppBarWithScroll from '@/components/AppBarWithScroll'

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
        bgcolor: 'background.default',
        pb: 12, // Consistent bottom padding
      }}
    >
      {/* Top AppBar with Scroll Elevation */}
      <AppBarWithScroll position="sticky" elevationTrigger={10}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.back()}
            sx={{ color: 'text.primary', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                color: 'text.primary',
                fontWeight: 900,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {exercise.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {exercise.muscleGroup}
            </Typography>
          </Box>
        </Toolbar>
      </AppBarWithScroll>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Personal Best Card */}
        <Card
          elevation={1}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <TrendingUp sx={{ color: 'primary.main', mr: 1, fontSize: '1.25rem' }} />
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700 }}>
                Personal Best
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 800, mr: 0.5 }}>
                {exercise.personalBest.weight} kg
              </Typography>
              <Typography variant="h4" sx={{ color: 'text.secondary', fontWeight: 800, mr: 0.5 }}>
                ×
              </Typography>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800 }}>
                {exercise.personalBest.reps}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Set on {exercise.personalBest.date}
            </Typography>
          </CardContent>
        </Card>

        {/* Historical Performances */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              mb: 2,
              textTransform: 'uppercase',
              fontSize: '1rem',
              letterSpacing: '0.02em',
            }}
          >
            History
          </Typography>

          <Card
            elevation={1}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
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
                      <CalendarToday sx={{ fontSize: '0.85rem', color: 'text.secondary', mr: 1 }} />
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', flex: 1, fontWeight: 500 }}
                      >
                        {entry.date}
                      </Typography>
                      {index === 2 && (
                        <Chip
                          label="PR"
                          size="small"
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            fontWeight: 'bold',
                            fontSize: '0.65rem',
                            height: 20,
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 0.5 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 800 }}>
                          <span style={{ color: 'var(--mui-palette-primary-main)' }}>
                            {entry.weight}kg
                          </span>{' '}
                          × {entry.reps}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 500 }}
                        >
                          Best set
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary', fontWeight: 600 }}
                        >
                          {entry.sets} sets
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {entry.volume}kg total
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < exercise.history.length - 1 && (
                    <Divider sx={{ bgcolor: 'divider', mx: 2.5, opacity: 0.5 }} />
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
