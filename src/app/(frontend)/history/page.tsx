'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import apiFetch from '@/lib/api/client'
import { fromKg, formatWeight } from '@/lib/utils/weightConversion'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Toolbar,
  IconButton,
  Divider,
  Skeleton,
} from '@mui/material'
import {
  History as HistoryIcon,
  AccessTime,
  FitnessCenter,
  CalendarMonth,
} from '@mui/icons-material'
import dayjs, { Dayjs } from 'dayjs'
import BottomNav from '@/components/BottomNav'
import HistoryDatePicker from '@/components/HistoryDatePicker'
import ChipFilter from '@/components/ChipFilter'

import { useSnackbar } from '@/hooks/useSnackbar'
import AppBarWithScroll from '@/components/AppBarWithScroll'

interface WorkoutHistoryItem {
  id: number
  name: string
  date: string
  time: string
  duration: string
  volume: string
  exercises: number
}

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('All')
  const [rawWorkouts, setRawWorkouts] = useState<WorkoutHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      if (!user) {
        console.log('No user found, skipping fetch')
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch user profile
        const userProfile = await apiFetch(`/users/${user.id}`)
        const userUnit = userProfile.preferredUnit || 'kg'

        // Calculate date range based on selectedMonth
        let queryParams = `?userId=${user.id}`

        if (selectedMonth) {
          const startDate = selectedMonth.startOf('month').toISOString()
          const endDate = selectedMonth.endOf('month').toISOString()
          queryParams += `&startDate=${startDate}&endDate=${endDate}`
        }

        // Fetch optimized history from custom endpoint
        const response = await apiFetch<{
          docs: {
            id: number
            name: string
            dateRaw: string
            duration: string
            volumeKg: number
            exercises: number
          }[]
        }>(`/custom/history${queryParams}`)

        // Map response to component state format
        const workoutsWithDetails = response.docs.map((item) => {
          const workoutDate = new Date(item.dateRaw)
          const dateStr = workoutDate.toISOString().split('T')[0]
          const timeStr = workoutDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })

          const volumeVal = fromKg(item.volumeKg, userUnit)

          return {
            id: item.id,
            name: item.name,
            date: dateStr,
            time: timeStr,
            duration: item.duration,
            volume: `${volumeVal.toLocaleString()} ${userUnit}`,
            exercises: item.exercises,
          }
        })

        setRawWorkouts(workoutsWithDetails)
      } catch (error) {
        console.error('Error fetching workout history:', error)
        showSnackbar({ message: 'Failed to load workout history', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutHistory()
  }, [user, selectedMonth, showSnackbar])

  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const getMonthHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  }

  // Filter Logic
  const filteredWorkouts = rawWorkouts.filter((workout) => {
    if (!selectedMonth) return true
    const workoutDate = dayjs(workout.date)
    return (
      workoutDate.month() === selectedMonth.month() && workoutDate.year() === selectedMonth.year()
    )
  })

  // Group by Month
  const groupedWorkouts = filteredWorkouts.reduce(
    (acc, workout) => {
      const header = getMonthHeader(workout.date)
      if (!acc[header]) acc[header] = []
      acc[header].push(workout)
      return acc
    },
    {} as Record<string, typeof rawWorkouts>,
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 10,
      }}
    >
      {/* Top AppBar with scroll elevation */}
      <AppBarWithScroll position="sticky" elevationTrigger={10}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              flexGrow: 1,
            }}
          >
            History
          </Typography>

          <IconButton
            onClick={() => setIsPickerOpen(true)}
            color={selectedMonth ? 'primary' : 'default'}
          >
            <CalendarMonth />
          </IconButton>
        </Toolbar>
      </AppBarWithScroll>

      <HistoryDatePicker
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSave={(date) => {
          setSelectedMonth(dayjs(date))
          setIsPickerOpen(false)
        }}
        initialDate={selectedMonth?.toDate() || new Date()}
      />

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 2 }}>
        {/* Chip Filters */}
        <Box sx={{ mb: 3 }}>
          <ChipFilter
            options={['All', 'This Week', 'This Month', 'Last Month']}
            selected={selectedPeriod}
            onChange={(value) => setSelectedPeriod(value as string)}
            label="Time Period"
            multiSelect={false}
          />
        </Box>

        {loading ? (
          <Box>
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                elevation={1}
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 1.5,
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Skeleton variant="text" width="60%" height={28} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2.5 }} />
                  <Divider sx={{ mb: 2.5 }} />
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                      <Skeleton variant="text" width={80} height={20} sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width={60} height={28} />
                    </Box>
                    <Box>
                      <Skeleton variant="text" width={80} height={20} sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width={80} height={28} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : Object.keys(groupedWorkouts).length > 0 ? (
          Object.keys(groupedWorkouts).map((header) => (
            <Box key={header} sx={{ mb: 4 }}>
              {/* Section Header */}
              <Box
                sx={{
                  mb: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  ml: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                  }}
                >
                  {header}
                </Typography>

                {selectedMonth && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'primary.main',
                      cursor: 'pointer',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                    }}
                    onClick={() => setSelectedMonth(null)}
                  >
                    CLEAR FILTER
                  </Typography>
                )}
              </Box>

              {groupedWorkouts[header].map((workout) => (
                <Card
                  key={workout.id}
                  elevation={1}
                  onClick={() => router.push(`/history/${workout.id}`)}
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 1.5,
                    cursor: 'pointer',
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    {/* Top Row: Name + Overflow Menu */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'text.primary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                          flex: 1,
                        }}
                      >
                        {workout.name}
                      </Typography>
                    </Box>

                    {/* Date Subtitle */}
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                      {getFormattedDate(workout.date)}
                    </Typography>

                    <Divider sx={{ borderColor: 'divider', mb: 2.5, opacity: 0.5 }} />

                    {/* Metrics Row */}
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      {/* Duration */}
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <AccessTime sx={{ fontSize: '1rem', color: 'primary.main' }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                            }}
                          >
                            DURATION
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {workout.duration}
                        </Typography>
                      </Box>

                      {/* Volume */}
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <FitnessCenter sx={{ fontSize: '1rem', color: 'primary.main' }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                            }}
                          >
                            VOLUME
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {workout.volume}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ))
        ) : (
          // Empty state for filtered view
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
            }}
          >
            <HistoryIcon sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
              No workouts found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Try selecting a different month
            </Typography>
            {selectedMonth && (
              <Typography
                variant="button"
                sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => setSelectedMonth(null)}
              >
                CLEAR FILTER
              </Typography>
            )}
          </Box>
        )}
      </Container>
      <BottomNav />
    </Box>
  )
}
