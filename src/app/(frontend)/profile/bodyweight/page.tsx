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
  TextField,
  Button,
  List,
  ListItem,
  Divider,
  Chip,
} from '@mui/material'
import { ArrowBack, TrendingDown, CalendarToday, Save, MonitorWeight } from '@mui/icons-material'

export default function BodyweightLogPage() {
  const router = useRouter()
  const [newWeight, setNewWeight] = useState('')

  // Mock data
  const currentWeight = 75.5
  const targetWeight = 72.0
  const weightLogs = [
    { date: 'January 20, 2026', weight: 75.5, change: -0.3 },
    { date: 'January 18, 2026', weight: 75.8, change: -0.2 },
    { date: 'January 15, 2026', weight: 76.0, change: -0.4 },
    { date: 'January 13, 2026', weight: 76.4, change: -0.1 },
    { date: 'January 10, 2026', weight: 76.5, change: -0.3 },
    { date: 'January 8, 2026', weight: 76.8, change: -0.2 },
    { date: 'January 5, 2026', weight: 77.0, change: 0.0 },
    { date: 'January 3, 2026', weight: 77.0, change: -0.5 },
  ]

  const handleSave = () => {
    // UI only - would save to database
    console.log('Saving weight:', newWeight)
    setNewWeight('')
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
            Bodyweight Log
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Current Weight Card */}
        <Card
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'primary.main',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <MonitorWeight sx={{ color: 'primary.main', mr: 1, fontSize: '1.25rem' }} />
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Current Weight
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1.5 }}>
              <Typography variant="h2" sx={{ color: 'text.primary', fontWeight: 'bold', mr: 0.5 }}>
                {currentWeight}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                kg
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Target: {targetWeight}kg
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                •
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {(currentWeight - targetWeight).toFixed(1)}kg to go
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Add New Weight */}
        <Card
          sx={{
            bgcolor: 'surfaceContainer',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
              Log New Weight
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="Enter weight in kg"
                InputProps={{
                  endAdornment: <Typography sx={{ color: 'text.secondary', ml: 1 }}>kg</Typography>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'text.primary',
                    bgcolor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!newWeight}
                startIcon={<Save />}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  px: 3,
                  py: 1.5,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'text.disabled',
                  },
                }}
              >
                Save
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Weight Chart Placeholder */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
            Weight Trend
          </Typography>
          <Card
            sx={{
              bgcolor: 'surfaceContainer',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <TrendingDown sx={{ fontSize: '3rem', color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Chart visualization placeholder
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Weight progress over time
              </Typography>
            </Box>
          </Card>
        </Box>

        {/* Weight History */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
            History
          </Typography>

          <Card
            sx={{
              bgcolor: 'surfaceContainer',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <List sx={{ p: 0 }}>
              {weightLogs.map((log, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    sx={{
                      px: 2.5,
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <CalendarToday
                          sx={{ fontSize: '0.9rem', color: 'text.secondary', mr: 1 }}
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {log.date}
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        {log.weight}{' '}
                        <span style={{ fontSize: '0.9rem', color: 'text.secondary' }}>kg</span>
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      {log.change !== 0 && (
                        <Chip
                          label={`${log.change > 0 ? '+' : ''}${log.change.toFixed(1)}kg`}
                          size="small"
                          sx={{
                            bgcolor: log.change < 0 ? 'success.dark' : 'error.dark', // Assuming success/error colors in theme or fallback
                            color: 'white', // Ensure contrast
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                          }}
                        />
                      )}
                      {log.change === 0 && (
                        <Chip
                          label="No change"
                          size="small"
                          sx={{
                            bgcolor: 'action.disabledBackground',
                            color: 'text.disabled',
                            fontSize: '0.8rem',
                          }}
                        />
                      )}
                    </Box>
                  </ListItem>
                  {index < weightLogs.length - 1 && (
                    <Divider sx={{ bgcolor: 'divider', mx: 2.5 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}
