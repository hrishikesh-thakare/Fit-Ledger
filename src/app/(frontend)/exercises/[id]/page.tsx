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
import apiFetch from '@/lib/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useSnackbar } from '@/hooks/useSnackbar'
import { Skeleton } from '@mui/material'

export default function ExerciseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const { showSnackbar } = useSnackbar()

  React.useEffect(() => {
    if (!user || !params.id) return

    const fetchData = async () => {
      try {
        const res = await apiFetch(`/custom/exercises/${params.id}/history?userId=${user.id}`)
        setData(res)
      } catch (error) {
        console.error('Failed to load exercise history', error)
        showSnackbar({ message: 'Failed to load history', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, params.id, showSnackbar]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 10, px: 2 }}>
        <Container maxWidth="sm">
          <Skeleton variant="text" height={40} width="60%" sx={{ mb: 1 }} />
          <Skeleton variant="text" height={20} width="30%" sx={{ mb: 4 }} />
          <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </Container>
      </Box>
    )
  }

  if (!data || !data.exercise) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 10, textAlign: 'center' }}>
        <Typography>Exercise not found</Typography>
      </Box>
    )
  }

  const { exercise, history } = data

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
        {exercise.personalBest && (
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
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CalendarToday sx={{ fontSize: '0.8rem', color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {new Date(exercise.personalBest.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

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

          {history.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, opacity: 0.6 }}>
              <Typography variant="body2">No history recorded yet.</Typography>
            </Box>
          ) : (
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
                {history.map((entry: any, index: number) => (
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
                        <CalendarToday
                          sx={{ fontSize: '0.85rem', color: 'text.secondary', mr: 1 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary', flex: 1, fontWeight: 500 }}
                        >
                          {new Date(entry.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Typography>
                        {exercise.personalBest &&
                          entry.weight >= exercise.personalBest.weight &&
                          entry.reps >= exercise.personalBest.reps &&
                          index === 0 /* Simple logic for latest PR badge if matches PB */ && (
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
                    {index < history.length - 1 && (
                      <Divider sx={{ bgcolor: 'divider', mx: 2.5, opacity: 0.5 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          )}
        </Box>
      </Container>
    </Box>
  )
}
