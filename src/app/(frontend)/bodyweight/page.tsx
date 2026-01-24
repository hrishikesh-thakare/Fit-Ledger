'use client'

import React, { useState } from 'react'

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  Divider,
  Chip,
} from '@mui/material'
import { CalendarToday, MonitorWeight, Add } from '@mui/icons-material'
import BottomNav from '@/components/BottomNav'
import WeightPicker from '@/components/WeightPicker'

export default function BodyweightLogPage() {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  // Mock data
  const currentWeight = 75.5
  const targetWeight = 72.0
  const weightLogs = [
    { date: 'January 20, 2026', weight: 75.5, change: -0.3 }, // Decrease (Red)
    { date: 'January 18, 2026', weight: 75.8, change: 0.5 }, // Increase (Green)
    { date: 'January 15, 2026', weight: 75.3, change: 1.2 }, // Increase (Green)
    { date: 'January 13, 2026', weight: 74.1, change: 0.0 }, // Neutral (Grey)
    { date: 'January 10, 2026', weight: 74.1, change: -0.4 }, // Decrease (Red)
    { date: 'January 8, 2026', weight: 74.5, change: -0.2 },
    { date: 'January 5, 2026', weight: 74.7, change: 0.0 },
    { date: 'January 3, 2026', weight: 74.7, change: -0.5 },
    { date: 'January 1, 2026', weight: 75.2, change: -0.3 },
    { date: 'December 28, 2025', weight: 75.5, change: 0.5 },
    { date: 'December 25, 2025', weight: 75.0, change: -0.2 },
    { date: 'December 22, 2025', weight: 75.2, change: -0.4 },
    { date: 'December 19, 2025', weight: 75.6, change: -0.1 },
    { date: 'December 16, 2025', weight: 75.7, change: -0.3 },
    { date: 'December 13, 2025', weight: 76.0, change: -0.2 },
    { date: 'December 10, 2025', weight: 76.2, change: 0.0 },
    { date: 'December 7, 2025', weight: 76.2, change: -0.5 },
    { date: 'December 4, 2025', weight: 76.7, change: -0.3 },
    { date: 'December 1, 2025', weight: 77.0, change: 0.0 },
    { date: 'November 28, 2025', weight: 77.0, change: -0.5 },
    { date: 'November 25, 2025', weight: 77.5, change: -0.5 },
  ]

  const handleSaveWeight = (weight: number, date: Date) => {
    // UI only - would save to database
    console.log('Saving weight:', weight, 'on date:', date)
    setIsPickerOpen(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 9, // Increased from 4 to 12 to clear the fixed BottomNav
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          top: 0,
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            Bodyweight Log
          </Typography>
          <IconButton onClick={() => setIsPickerOpen(true)} color="primary">
            <Add />
          </IconButton>
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

        <WeightPicker
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSave={handleSaveWeight}
          initialWeight={currentWeight}
        />

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
                          variant="filled"
                          sx={{
                            bgcolor: 'action.hover',
                            color: log.change < 0 ? 'error.main' : 'success.main',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            border: 'none',
                          }}
                        />
                      )}
                      {log.change === 0 && (
                        <Chip
                          label="No change"
                          size="small"
                          variant="filled"
                          sx={{
                            bgcolor: 'action.hover',
                            color: 'text.secondary',
                            fontWeight: 'bold', // Added for consistency
                            fontSize: '0.8rem',
                            border: 'none',
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
      <BottomNav />
    </Box>
  )
}
