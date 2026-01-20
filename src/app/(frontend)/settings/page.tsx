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
        bgcolor: '#000000',
        pb: 4,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.push('/profile')}
            sx={{ color: '#ffffff', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Appearance Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Appearance
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
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Brightness4 sx={{ color: '#666666', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Dark Mode"
                  primaryTypographyProps={{ sx: { color: '#ffffff', fontWeight: 500, fontSize: '0.95rem' } }}
                />
                <Switch
                  checked={darkModeEnabled}
                  onChange={handleThemeChange}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#2196F3',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#2196F3',
                    },
                  }}
                />
              </ListItem>
            </List>
          </Card>
        </Box>

        {/* Workout Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Workout
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
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <FitnessCenter sx={{ color: '#666666', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Weight Units"
                  primaryTypographyProps={{ sx: { color: '#ffffff', fontWeight: 500, fontSize: '0.95rem' } }}
                />
                <Select
                  value={units}
                  onChange={(e) => setUnits(e.target.value as 'kg' | 'lb')}
                  size="small"
                  sx={{
                    color: '#ffffff',
                    bgcolor: '#0a0a0a',
                    fontSize: '0.9rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#333333',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196F3',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196F3',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#666666',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#0a0a0a',
                        border: '1px solid #222222',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          fontSize: '0.9rem',
                          '&:hover': {
                            bgcolor: '#111111',
                          },
                          '&.Mui-selected': {
                            bgcolor: '#1a1a1a',
                            '&:hover': {
                              bgcolor: '#222222',
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
          <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data & Information
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
                onClick={() => {/* UI only - would export data */}}
                sx={{
                  cursor: 'pointer',
                  py: 1.5,
                  '&:active': {
                    bgcolor: '#111111',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CloudDownload sx={{ color: '#666666', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Export Data"
                  primaryTypographyProps={{ sx: { color: '#ffffff', fontWeight: 500, fontSize: '0.95rem' } }}
                />
                <ChevronRight sx={{ color: '#444444', fontSize: '1.25rem' }} />
              </ListItem>
              
              <Divider sx={{ bgcolor: '#1a1a1a' }} />
              
              <ListItem
                onClick={() => {/* UI only - would show about page */}}
                sx={{
                  cursor: 'pointer',
                  py: 1.5,
                  '&:active': {
                    bgcolor: '#111111',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Info sx={{ color: '#666666', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="About"
                  primaryTypographyProps={{ sx: { color: '#ffffff', fontWeight: 500, fontSize: '0.95rem' } }}
                />
                <ChevronRight sx={{ color: '#444444', fontSize: '1.25rem' }} />
              </ListItem>
            </List>
          </Card>
        </Box>

        {/* App Version */}
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="caption" sx={{ color: '#444444' }}>
            FitLedger v1.0.0
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
