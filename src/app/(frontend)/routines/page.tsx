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
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  IconButton,
  Stack,
} from '@mui/material'
import {
  FitnessCenter,
  History,
  Person,
  Dashboard as DashboardIcon,
  Add,
  ArrowBack,
  ChevronRight,
} from '@mui/icons-material'

export default function RoutinesPage() {
  const router = useRouter()
  const [navValue, setNavValue] = useState(1)

  const routines = [
    { id: 1, name: 'Push Day', exerciseCount: 6, description: 'Chest, Shoulders, Triceps' },
    { id: 2, name: 'Pull Day', exerciseCount: 5, description: 'Back, Biceps, Rear Delts' },
    { id: 3, name: 'Leg Day', exerciseCount: 7, description: 'Quads, Hamstrings, Calves' },
    { id: 4, name: 'Upper Body', exerciseCount: 8, description: 'Full upper body workout' },
    { id: 5, name: 'Core & Abs', exerciseCount: 4, description: 'Core strengthening' },
  ]

  const handleNavChange = (event: React.SyntheticEvent, newValue: number) => {
    setNavValue(newValue)
    const routes = ['/dashboard', '/routines', '/history', '/profile']
    router.push(routes[newValue])
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
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="titleLarge" fontWeight="bold" sx={{ flexGrow: 1 }}>
            My Routines
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Subtitle */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="bodyMedium" color="text.secondary">
            {routines.length} workout routines
          </Typography>
        </Box>

        {/* Routines List */}
        <Stack spacing={1.5}>
          {routines.map((routine) => (
            <Card
              key={routine.id}
              sx={{
                cursor: 'pointer',
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
              onClick={() => router.push(`/routines/${routine.id}`)}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack spacing={0.5} flex={1}>
                    <Typography variant="titleMedium">
                      {routine.name}
                    </Typography>
                    <Typography variant="bodySmall" color="text.disabled">
                      {routine.exerciseCount} exercises • {routine.description}
                    </Typography>
                  </Stack>
                  <ChevronRight sx={{ color: 'text.disabled' }} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Empty state if needed */}
        {routines.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
            }}
          >
            <FitnessCenter sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
            <Typography variant="titleMedium" color="text.secondary" sx={{ mb: 1 }}>
              No routines yet
            </Typography>
            <Typography variant="bodyMedium" color="text.disabled">
              Create your first workout routine
            </Typography>
          </Box>
        )}
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add routine"
        onClick={() => router.push('/routines/new')}
        sx={{
          position: 'fixed',
          bottom: 96,
          right: 16,
        }}
      >
        <Add sx={{ fontSize: '1.75rem' }} />
      </Fab>

      {/* Bottom Navigation */}
      <BottomNavigation
        value={navValue}
        onChange={handleNavChange}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} />
        <BottomNavigationAction label="Routines" icon={<FitnessCenter />} />
        <BottomNavigationAction label="History" icon={<History />} />
        <BottomNavigationAction label="Profile" icon={<Person />} />
      </BottomNavigation>
    </Box>
  )
}
