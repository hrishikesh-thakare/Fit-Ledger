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
import BottomNav from '@/components/BottomNav'

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
        bgcolor: 'background.default',
        pb: 8,
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', flex: 1 }}>
            Profile
          </Typography>
          <IconButton
            onClick={() => router.push('/settings')}
            sx={{
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'action.hover',
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
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'surfaceContainer',
                color: 'text.secondary',
                margin: '0 auto',
                mb: 1.5,
                fontSize: '1.5rem',
                fontWeight: 600,
              }}
            >
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Avatar>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.25 }}>
              {user.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {user.email}
            </Typography>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              mb: 1.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Stats
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 1.5 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography
                  variant="h5"
                  sx={{ color: 'text.primary', fontWeight: 'bold', mb: 0.25 }}
                >
                  {user.totalWorkouts}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Workouts
                </Typography>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography
                  variant="h5"
                  sx={{ color: 'text.primary', fontWeight: 'bold', mb: 0.25 }}
                >
                  {user.activeDays}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Active Days
                </Typography>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'primary.main',
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography
                  variant="h5"
                  sx={{ color: 'primary.main', fontWeight: 'bold', mb: 0.25 }}
                >
                  {user.currentStreak}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Streak
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Quick Links */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              mb: 1.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Quick Links
          </Typography>

          <Card
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
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
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <MonitorWeight sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Bodyweight Log"
                  primaryTypographyProps={{
                    sx: { color: 'text.primary', fontWeight: 500, fontSize: '0.95rem' },
                  }}
                />
                <ChevronRight sx={{ color: 'text.disabled', fontSize: '1.25rem' }} />
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
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <BottomNav />
      </Box>
    </Box>
  )
}
