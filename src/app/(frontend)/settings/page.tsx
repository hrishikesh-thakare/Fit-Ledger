'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Select,
  MenuItem,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  Brightness4,
  FitnessCenter,
  CloudDownload,
  Info,
  ChevronRight,
} from '@mui/icons-material'

export default function SettingsPage() {
  const router = useRouter()
  const [_theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')
  const [units, setUnits] = useState<'kg' | 'lb'>('kg')
  const [darkModeEnabled, setDarkModeEnabled] = useState(true)

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDarkModeEnabled(event.target.checked)
    setTheme(event.target.checked ? 'dark' : 'light')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 4,
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.push('/profile')}
            sx={{ color: 'text.primary', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Appearance Section */}
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
            Appearance
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
            </List>
          </Card>
        </Box>

        {/* Workout Settings */}
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
            Workout
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
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        '& .MuiMenuItem-root': {
                          color: 'text.primary',
                          fontSize: '0.9rem',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                          '&.Mui-selected': {
                            bgcolor: 'action.selected',
                            '&:hover': {
                              bgcolor: 'action.selected',
                            },
                          },
                        },
                      },
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

        {/* Data & Information */}
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
            Data & Information
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

              <Divider sx={{ bgcolor: 'divider' }} />

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
                  primary="About"
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
    </Box>
  )
}
