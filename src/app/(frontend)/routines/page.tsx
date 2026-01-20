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
        bgcolor: '#000000',
        pb: 10,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.push('/dashboard')}
            sx={{ color: '#ffffff', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', flexGrow: 1 }}>
            My Routines
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Subtitle */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#888888' }}>
            {routines.length} workout routines
          </Typography>
        </Box>

        {/* Routines List */}
        <Stack spacing={1.5}>
          {routines.map((routine) => (
            <Card
              key={routine.id}
              elevation={0}
              sx={{
                bgcolor: '#0a0a0a',
                border: '1px solid #222222',
                borderRadius: 1,
                cursor: 'pointer',
                '&:active': {
                  bgcolor: '#111111',
                },
              }}
              onClick={() => router.push(`/routines/${routine.id}`)}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack spacing={0.5} flex={1}>
                    <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      {routine.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.8rem' }}>
                      {routine.exerciseCount} exercises • {routine.description}
                    </Typography>
                  </Stack>
                  <ChevronRight sx={{ color: '#444444', fontSize: '1.25rem' }} />
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
            <FitnessCenter sx={{ fontSize: '4rem', color: '#333333', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#888888', mb: 1 }}>
              No routines yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666' }}>
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
          bottom: 88,
          right: 16,
          bgcolor: '#2196F3',
          color: '#ffffff',
          width: 56,
          height: 56,
          boxShadow: '0 8px 16px rgba(33, 150, 243, 0.4)',
          '&:hover': {
            bgcolor: '#1976D2',
            boxShadow: '0 12px 24px rgba(33, 150, 243, 0.5)',
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
          bgcolor: '#0a0a0a',
          borderTop: '1px solid #1a1a1a',
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            color: '#888888',
            minWidth: 'auto',
            '&.Mui-selected': {
              color: '#2196F3',
            },
          },
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
