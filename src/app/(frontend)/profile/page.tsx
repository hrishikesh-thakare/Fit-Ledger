'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material'
import {
  Brightness4,
  FitnessCenter,
  CloudDownload,
  Edit,
  ChevronRight,
  Info,
} from '@mui/icons-material'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  const router = useRouter()

  // Settings State
  const [_theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')
  const [units, setUnits] = useState<'kg' | 'lb'>('kg')
  const [darkModeEnabled, setDarkModeEnabled] = useState(true)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDarkModeEnabled(event.target.checked)
    setTheme(event.target.checked ? 'dark' : 'light')
  }

  // Mock data
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    joinDate: 'December 2025',
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 12, // Extra padding for bottom nav
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        elevation={scrolled ? 2 : 0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          top: 0,
          zIndex: 1100,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', flex: 1 }}>
            Profile
          </Typography>
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
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'action.selected',
                color: 'text.secondary',
                margin: '0 auto',
                mb: 2,
                fontSize: '2rem',
                fontWeight: 600,
              }}
            >
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Avatar>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
              {user.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              @{user.name.toLowerCase().replace(' ', '_')}
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Member since {user.joinDate}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Edit Profile Button (Inside Card) */}
            <ListItem
              onClick={() => setSnackbarOpen(true)}
              sx={{
                cursor: 'pointer',
                py: 1,
                px: 2,
                borderRadius: 1,
                bgcolor: 'action.hover',
                '&:active': {
                  bgcolor: 'action.selected',
                },
                justifyContent: 'center',
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Edit sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
              </ListItemIcon>
              <Typography
                variant="button"
                color="primary"
                fontWeight="bold"
                sx={{ textTransform: 'none' }}
              >
                Edit Profile
              </Typography>
            </ListItem>
          </CardContent>
        </Card>

        {/* Preferences Section */}
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
            Preferences
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
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Brightness4 sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Dark Mode"
                  primaryTypographyProps={{
                    sx: { color: 'text.primary', fontWeight: 500, fontSize: '0.95rem' },
                  }}
                />
                <Switch
                  checked={darkModeEnabled}
                  onChange={handleThemeChange}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'primary.main',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'primary.main',
                    },
                  }}
                />
              </ListItem>

              <Divider sx={{ bgcolor: 'divider' }} />

              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <FitnessCenter sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Weight Units"
                  primaryTypographyProps={{
                    sx: { color: 'text.primary', fontWeight: 500, fontSize: '0.95rem' },
                  }}
                />
                <Select
                  value={units}
                  onChange={(e) => setUnits(e.target.value as 'kg' | 'lb')}
                  size="small"
                  sx={{
                    color: 'text.primary',
                    bgcolor: 'background.paper',
                    fontSize: '0.9rem',
                    height: 32,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'text.secondary',
                    },
                  }}
                >
                  <MenuItem value="kg">kg</MenuItem>
                  <MenuItem value="lb">lb</MenuItem>
                </Select>
              </ListItem>
            </List>
          </Card>
        </Box>

        {/* Data Section */}
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
            Data
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
                onClick={() => {
                  /* UI only - would export data */
                }}
                sx={{
                  cursor: 'pointer',
                  py: 1.5,
                  '&:active': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CloudDownload sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Export Data"
                  primaryTypographyProps={{
                    sx: { color: 'text.primary', fontWeight: 500, fontSize: '0.95rem' },
                  }}
                />
                <ChevronRight sx={{ color: 'text.disabled', fontSize: '1.25rem' }} />
              </ListItem>
            </List>
          </Card>
        </Box>

        {/* About Section */}
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
            About
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
                onClick={() => {
                  /* UI only - would show about page */
                }}
                sx={{
                  cursor: 'pointer',
                  py: 1.5,
                  '&:active': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Info sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="About FitLedger"
                  primaryTypographyProps={{
                    sx: { color: 'text.primary', fontWeight: 500, fontSize: '0.95rem' },
                  }}
                />
                <ChevronRight sx={{ color: 'text.disabled', fontSize: '1.25rem' }} />
              </ListItem>
            </List>
          </Card>
        </Box>

        {/* App Version */}
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            FitLedger v1.0.0
          </Typography>
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

      {/* Coming Soon Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: 80 }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          variant="filled"
          sx={{
            width: '100%',
            alignItems: 'center',
            '& .MuiAlert-action': {
              paddingTop: 0,
              paddingBottom: 0,
              alignItems: 'center',
            },
          }}
        >
          Coming soon
        </Alert>
      </Snackbar>
    </Box>
  )
}
