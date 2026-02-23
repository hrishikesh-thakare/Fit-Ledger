'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Fade,
  CardActionArea,
} from '@mui/material'
import {
  History as HistoryIcon,
  AccessTime,
  FitnessCenter,
  CalendarMonth,
} from '@mui/icons-material'
import dayjs, { Dayjs } from 'dayjs'
import AppScaffold from '@/components/layout/AppScaffold'
import PageContainer from '@/components/layout/PageContainer'
import HistoryDatePicker from '@/components/HistoryDatePicker'
import PageAppBar from '@/components/PageAppBar'
import ChipFilter from '@/components/ChipFilter'

import { useSnackbar } from '@/hooks/useSnackbar'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import AppBarWithScroll from '@/components/AppBarWithScroll'
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator'

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
        // No user found, skipping fetch
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        await fetchData()
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutHistory()
  }, [user, selectedMonth, showSnackbar])

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      // Fetch user's preferred unit
      const userUnit = user?.preferredUnit || 'kg'

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
    }
  }, [user, selectedMonth, showSnackbar])

  const { isRefreshing, pullDistance } = usePullToRefresh({ onRefresh: fetchData })

  const formatDurationString = (dur: string) => {
    if (!dur) return '0m'
    // Expected formats: "HH:MM:SS" or "MM:SS"
    const parts = dur.split(':').map(Number)
    if (parts.length === 3) {
      const [h, m, s] = parts
      if (h > 0) return `${h}h ${m}m`
      if (m > 0) return `${m}m`
      return `${s}s`
    }
    if (parts.length === 2) {
      const [m, s] = parts
      if (m > 0) return `${m}m`
      return `${s}s`
    }
    return dur
  }

  const getMonthHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  }

  // Filter Logic
  const filteredWorkouts = rawWorkouts.filter((workout) => {
    const workoutDate = dayjs(workout.date)

    // 1. Filter by specific month picker (if selected)
    if (selectedMonth) {
      return (
        workoutDate.month() === selectedMonth.month() && workoutDate.year() === selectedMonth.year()
      )
    }

    // 2. Filter by chip period (if no specific month selected)
    const now = dayjs()
    switch (selectedPeriod) {
      case 'This Week':
        // localized week start
        return workoutDate.isAfter(now.startOf('week').subtract(1, 'millisecond'))
      case 'This Month':
        return workoutDate.isSame(now, 'month')
      case 'Last Month':
        return workoutDate.isSame(now.subtract(1, 'month'), 'month')
      case 'All':
      default:
        return true
    }
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
    <AppScaffold showBottomNav>
      {/* Top AppBar with scroll elevation */}
      <PageAppBar
        title="History"
        actions={
          <IconButton
            onClick={() => setIsPickerOpen(true)}
            color={selectedMonth ? 'primary' : 'default'}
          >
            <CalendarMonth />
          </IconButton>
        }
      />

      <HistoryDatePicker
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSave={(date) => {
          setSelectedMonth(dayjs(date))
          setIsPickerOpen(false)
        }}
        initialDate={selectedMonth?.toDate() || new Date()}
      />

      <PageContainer pt={2}>
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
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
            {/* Month header skeleton */}
            <Skeleton variant="text" width={140} height={16} sx={{ mb: 1.5, ml: 0.5 }} />
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
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  {/* Name + Date row */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      mb: 0.5,
                    }}
                  >
                    <Skeleton variant="text" width="55%" height={28} />
                    <Skeleton variant="text" width={50} height={20} />
                  </Box>
                  {/* Stats row: duration · volume */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="text" width={50} height={20} />
                    <Skeleton variant="circular" width={4} height={4} />
                    <Skeleton variant="text" width={70} height={20} />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : Object.keys(groupedWorkouts).length > 0 ? (
          <Fade in timeout={400}>
            <Box>
              {Object.keys(groupedWorkouts).map((header) => (
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
                      sx={{
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1.5,
                      }}
                    >
                      <CardActionArea
                        onClick={() => router.push(`/history/${workout.id}`)}
                        sx={{
                          '& .MuiCardActionArea-focusHighlight': {
                            bgcolor: 'transparent',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          {/* Header Row: Name + Date */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                color: 'text.primary',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                letterSpacing: 0,
                                flex: 1,
                                mr: 2,
                              }}
                            >
                              {workout.name.toLowerCase()}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.disabled',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {new Date(workout.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                          </Box>

                          {/* Stats Row: Duration · Volume */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                              <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', fontWeight: 500 }}
                              >
                                {formatDurationString(workout.duration)}
                              </Typography>
                            </Box>

                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                              ·
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <FitnessCenter
                                sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', fontWeight: 500 }}
                              >
                                {workout.volume}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))}
                </Box>
              ))}
            </Box>
          </Fade>
        ) : (
          // Empty state for filtered view
          <Fade in timeout={400}>
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
          </Fade>
        )}
      </PageContainer>
    </AppScaffold>
  )
}
