'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  Divider,
  Stack,
} from '@mui/material'
import { FitnessCenter } from '@mui/icons-material'
import BottomNav from '@/components/BottomNav'

export default function DashboardPage() {
  const router = useRouter()

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
          <Typography variant="titleLarge" sx={{ fontWeight: 'bold' }}>
            Good morning! 👋
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3, pb: 10 }}>
        {/* Last Workout Summary Card */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <FitnessCenter sx={{ color: 'primary.main', fontSize: '1.25rem' }} />
              <Typography variant="titleMedium">Last Workout Summary</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="bodyMedium" color="text.secondary">
                  Workout:
                </Typography>
                <Typography variant="bodyMedium" fontWeight={600}>
                  Push Day
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="bodyMedium" color="text.secondary">
                  Date:
                </Typography>
                <Typography variant="bodyMedium" fontWeight={600}>
                  Yesterday
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="bodyMedium" color="text.secondary">
                  Duration:
                </Typography>
                <Typography variant="bodyMedium" fontWeight={600}>
                  45 minutes
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="bodyMedium" color="text.secondary">
                  Exercises:
                </Typography>
                <Typography variant="bodyMedium" fontWeight={600}>
                  6 exercises
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Weekly Workout Count Card */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography
              variant="labelLarge"
              color="text.disabled"
              sx={{ mb: 1.5, textTransform: 'uppercase' }}
            >
              This Week
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="headlineLarge" fontWeight="bold">
                4
              </Typography>
              <Typography variant="bodyMedium" color="text.disabled">
                workouts
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} justifyContent="flex-start">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    borderRadius: '8px',
                    bgcolor: index < 4 ? 'primary.main' : 'surfaceContainerLow',
                    border: index < 4 ? 'none' : '1px solid',
                    borderColor: 'outline',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="labelSmall"
                    color={index < 4 ? 'primary.contrastText' : 'text.disabled'}
                    fontWeight={500}
                  >
                    {day}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Bodyweight Trend Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="labelLarge"
              color="text.disabled"
              sx={{ mb: 2, textTransform: 'uppercase' }}
            >
              Bodyweight
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Stack spacing={0}>
                <Typography variant="headlineMedium" fontWeight="bold">
                  75.5
                </Typography>
                <Typography variant="labelSmall" color="text.disabled">
                  kg current
                </Typography>
              </Stack>
              <Stack spacing={0} alignItems="flex-end">
                <Typography variant="headlineSmall" color="text.disabled" fontWeight="bold">
                  80.0
                </Typography>
                <Typography variant="labelSmall" color="text.disabled">
                  kg goal
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Start Workout Button */}
        <Button fullWidth variant="contained" size="large" onClick={() => router.push('/routines')}>
          Start Workout
        </Button>
      </Container>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  )
}
