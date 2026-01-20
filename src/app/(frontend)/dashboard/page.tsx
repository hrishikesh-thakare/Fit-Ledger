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
  BottomNavigation,
  BottomNavigationAction,
  Divider,
  Stack,
} from '@mui/material'
import {
  FitnessCenter,
  History,
  Person,
  Dashboard as DashboardIcon,
} from '@mui/icons-material'

export default function DashboardPage() {
  const router = useRouter()
  const [navValue, setNavValue] = useState(0)

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
        pb: 8,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
            Good morning! 👋
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3, pb: 10 }}>
        {/* Last Workout Summary Card */}
        <Card
          elevation={0}
          sx={{
            bgcolor: '#0a0a0a',
            border: '1px solid #222222',
            borderRadius: 1,
            mb: 2,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <FitnessCenter sx={{ color: '#2196F3', fontSize: '1.25rem' }} />
              <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                Last Workout Summary
              </Typography>
            </Stack>
            <Divider sx={{ bgcolor: '#222222', mb: 1.5 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#888888' }}>
                  Workout:
                </Typography>
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Push Day
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#888888' }}>
                  Date:
                </Typography>
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Yesterday
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#888888' }}>
                  Duration:
                </Typography>
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  45 minutes
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#888888' }}>
                  Exercises:
                </Typography>
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  6 exercises
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Weekly Workout Count Card */}
        <Card
          elevation={0}
          sx={{
            bgcolor: '#0a0a0a',
            border: '1px solid #222222',
            borderRadius: 1,
            mb: 2,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              This Week
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                4
              </Typography>
              <Typography variant="body2" sx={{ color: '#666666' }}>
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
                    borderRadius: '4px',
                    bgcolor: index < 4 ? '#2196F3' : '#1a1a1a',
                    border: index < 4 ? 'none' : '1px solid #333333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: index < 4 ? '#ffffff' : '#666666', fontWeight: 500, fontSize: '0.7rem' }}>
                    {day}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Bodyweight Trend Card */}
        <Card
          elevation={0}
          sx={{
            bgcolor: '#0a0a0a',
            border: '1px solid #222222',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bodyweight
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Stack spacing={0}>
                <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                  75.5
                </Typography>
                <Typography variant="caption" sx={{ color: '#666666' }}>
                  kg current
                </Typography>
              </Stack>
              <Stack spacing={0} alignItems="flex-end">
                <Typography variant="h5" sx={{ color: '#666666', fontWeight: 'bold' }}>
                  80.0
                </Typography>
                <Typography variant="caption" sx={{ color: '#666666' }}>
                  kg goal
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Start Workout Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => router.push('/routines')}
          sx={{
            py: 1.5,
            minHeight: 52,
            bgcolor: '#2196F3',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: 1,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#1976D2',
              boxShadow: 'none',
            },
          }}
        >
          Start Workout
        </Button>
      </Container>

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
          height: 72,
          '& .MuiBottomNavigationAction-root': {
            color: '#888888',
            minWidth: 64,
            minHeight: 72,
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
