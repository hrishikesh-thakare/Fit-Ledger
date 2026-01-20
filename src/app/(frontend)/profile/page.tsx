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
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Settings,
  Home,
  FitnessCenter,
  History,
  Person,
  MonitorWeight,
  ChevronRight,
} from '@mui/icons-material'

export default function ProfilePage() {
  const router = useRouter()
  const [navValue, setNavValue] = useState(3)

  // Mock data
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    totalWorkouts: 47,
    activeDays: 23,
    currentStreak: 7,
    joinDate: 'December 2025',
  }

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
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', flex: 1 }}>
            Profile
          </Typography>
          <IconButton
            onClick={() => router.push('/settings')}
            sx={{
              color: '#2196F3',
              '&:hover': {
                bgcolor: 'rgba(33, 150, 243, 0.1)',
              },
            }}
          >
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* User Info Card */}
        <Card
          elevation={0}
          sx={{
            bgcolor: '#0a0a0a',
            border: '1px solid #222222',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#222222',
                color: '#888888',
                margin: '0 auto',
                mb: 1.5,
                fontSize: '1.5rem',
                fontWeight: 600,
              }}
            >
              {user.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, mb: 0.25 }}>
              {user.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666' }}>
              {user.email}
            </Typography>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Stats
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 1.5 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: '#0a0a0a',
                border: '1px solid #222222',
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 0.25 }}>
                  {user.totalWorkouts}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666666' }}>
                  Workouts
                </Typography>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                bgcolor: '#0a0a0a',
                border: '1px solid #222222',
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 0.25 }}>
                  {user.activeDays}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666666' }}>
                  Active Days
                </Typography>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                bgcolor: '#0a0a0a',
                border: '1px solid #2196F3',
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ color: '#2196F3', fontWeight: 'bold', mb: 0.25 }}>
                  {user.currentStreak}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666666' }}>
                  Streak
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Quick Links */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Links
          </Typography>
          
          <Card
            elevation={0}
            sx={{
              bgcolor: '#0a0a0a',
              border: '1px solid #222222',
              borderRadius: 1,
            }}
          >
            <List sx={{ p: 0 }}>
              <ListItem
                onClick={() => router.push('/profile/bodyweight')}
                sx={{
                  cursor: 'pointer',
                  py: 1.5,
                  '&:active': {
                    bgcolor: '#111111',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <MonitorWeight sx={{ color: '#666666', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Bodyweight Log"
                  primaryTypographyProps={{ sx: { color: '#ffffff', fontWeight: 500, fontSize: '0.95rem' } }}
                />
                <ChevronRight sx={{ color: '#444444', fontSize: '1.25rem' }} />
              </ListItem>
            </List>
          </Card>
        </Box>
      </Container>

      {/* Bottom Navigation */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#0a0a0a',
          borderTop: '1px solid #1a1a1a',
        }}
      >
        <BottomNavigation
          value={navValue}
          onChange={handleNavChange}
          sx={{
            bgcolor: 'transparent',
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
          <BottomNavigationAction label="Dashboard" icon={<Home />} />
          <BottomNavigationAction label="Routines" icon={<FitnessCenter />} />
          <BottomNavigationAction label="History" icon={<History />} />
          <BottomNavigationAction label="Profile" icon={<Person />} />
        </BottomNavigation>
      </Box>
    </Box>
  )
}
