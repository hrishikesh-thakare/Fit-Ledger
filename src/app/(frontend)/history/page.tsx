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
} from '@mui/material'
import {
  FitnessCenter,
  History as HistoryIcon,
  Person,
  Dashboard as DashboardIcon,
} from '@mui/icons-material'

export default function HistoryPage() {
  const router = useRouter()
  const [navValue, setNavValue] = useState(2)

  const workouts = [
    { id: 1, name: 'Push Day', date: 'Today', time: '2:30 PM', duration: '45 min', exercises: 6 },
    { id: 2, name: 'Leg Day', date: 'Yesterday', time: '10:00 AM', duration: '60 min', exercises: 7 },
    { id: 3, name: 'Pull Day', date: '2 days ago', time: '3:00 PM', duration: '50 min', exercises: 5 },
    { id: 4, name: 'Push Day', date: '4 days ago', time: '2:00 PM', duration: '42 min', exercises: 6 },
    { id: 5, name: 'Core & Abs', date: '5 days ago', time: '7:00 PM', duration: '30 min', exercises: 4 },
    { id: 6, name: 'Leg Day', date: '7 days ago', time: '10:30 AM', duration: '58 min', exercises: 7 },
    { id: 7, name: 'Upper Body', date: '9 days ago', time: '2:45 PM', duration: '55 min', exercises: 8 },
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
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', flexGrow: 1 }}>
            Workout History
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Subtitle */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#888888' }}>
            Recent activity
          </Typography>
        </Box>

        {/* Workout List */}
        {workouts.map((workout) => (
          <Card
            key={workout.id}
            elevation={0}
            sx={{
              bgcolor: '#0a0a0a',
              border: '1px solid #222222',
              borderRadius: 1,
              mb: 1.5,
              cursor: 'pointer',
              '&:active': {
                bgcolor: '#111111',
              },
            }}
            onClick={() => {router.push(`/history/${workout.id}`)}}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 600, mb: 0.25 }}>
                    {workout.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.8rem' }}>
                    {workout.date} • {workout.duration} • {workout.exercises} exercises
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Empty state if needed */}
        {workouts.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
            }}
          >
            <HistoryIcon sx={{ fontSize: '4rem', color: '#333333', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#888888', mb: 1 }}>
              No workout history
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666' }}>
              Start your first workout to see it here
            </Typography>
          </Box>
        )}
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
        <BottomNavigationAction label="History" icon={<HistoryIcon />} />
        <BottomNavigationAction label="Profile" icon={<Person />} />
      </BottomNavigation>
    </Box>
  )
}
