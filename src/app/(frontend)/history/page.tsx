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
  IconButton,
  Divider,
} from '@mui/material'
import {
  History as HistoryIcon,
  ChevronRight,
  AccessTime,
  FitnessCenter,
  CalendarMonth,
} from '@mui/icons-material'
import dayjs, { Dayjs } from 'dayjs'
import BottomNav from '@/components/BottomNav'
import HistoryDatePicker from '@/components/HistoryDatePicker'

// Mock Data
const rawWorkouts = [
  {
    id: 1,
    name: 'Leg Day A',
    date: '2023-10-23', // Monday
    time: '2:30 PM',
    duration: '01:12:45',
    volume: '14,250 lbs',
    exercises: 6,
  },
  {
    id: 2,
    name: 'Push Routine',
    date: '2023-10-21', // Saturday
    time: '10:00 AM',
    duration: '00:58:12',
    volume: '8,120 lbs',
    exercises: 7,
  },
  {
    id: 3,
    name: 'Pull Strength',
    date: '2023-10-19', // Thursday
    time: '3:00 PM',
    duration: '01:05:30',
    volume: '11,400 lbs',
    exercises: 5,
  },
  {
    id: 4,
    name: 'Upper Body Power',
    date: '2023-09-28',
    time: '2:00 PM',
    duration: '00:55:00',
    volume: '9,500 lbs',
    exercises: 6,
  },
  {
    id: 5,
    name: 'Core & Abs',
    date: '2023-09-25',
    time: '7:00 PM',
    duration: '00:30:00',
    volume: '0 lbs',
    exercises: 4,
  },
  {
    id: 6,
    name: 'Leg Day B',
    date: '2023-09-22',
    time: '10:30 AM',
    duration: '01:10:00',
    volume: '13,800 lbs',
    exercises: 7,
  },
]

export default function HistoryPage() {
  const router = useRouter()
  // Default to null (Show all)
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

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
      </AppBar>

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
        {Object.keys(groupedWorkouts).length > 0 ? (
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
                  elevation={0}
                  onClick={() => router.push(`/history/${workout.id}`)}
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 1.5,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:active': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    {/* Top Row: Name + Arrow */}
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
                        }}
                      >
                        {workout.name}
                      </Typography>
                      <ChevronRight sx={{ color: 'text.disabled' }} />
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
