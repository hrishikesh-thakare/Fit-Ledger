'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import apiFetch from '@/lib/api/client'
import type { BodyWeightLog } from '@/payload-types'
import { useSnackbar } from '@/hooks/useSnackbar'
import { toKg, fromKg, formatWeight } from '@/lib/utils/weightConversion'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Toolbar,
  List,
  ListItem,
  Divider,
  Chip,
  Fab,
  Skeleton,
} from '@mui/material'
import { CalendarToday, MonitorWeight, Add } from '@mui/icons-material'
import BottomNav from '@/components/BottomNav'
import WeightPicker from '@/components/WeightPicker'
import AppBarWithScroll from '@/components/AppBarWithScroll'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'

interface ProcessedLog {
  id: number
  date: string
  weight: number
  rawWeight: number // kg
  change: number
  rawDate: string
}

export default function BodyweightLogPage() {
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()
  const { isActive: isWorkoutActive } = useWorkoutSession()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [weightLogs, setWeightLogs] = useState<ProcessedLog[]>([])
  const [loading, setLoading] = useState(true)
  const [targetWeight, setTargetWeight] = useState<number | null>(null)
  const [preferredUnit, setPreferredUnit] = useState<'kg' | 'lb'>('kg')

  useEffect(() => {
    const fetchWeightLogs = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Use user profile from context
        const userUnit = user.preferredUnit || 'kg'
        setPreferredUnit(userUnit)

        // if (user.targetWeight) { // Check if targetWeight is available in restricted user type
        //   setTargetWeight(user.targetWeight)
        // }
        // For now, let's see if we can get away with just preferredUnit or if we really need targetWeight.
        // The previous code fetched it. Let's assume we might lack targetWeight in the default user context if it's not in the depth 0 user.
        // Actually, let's keep it simple: If we need targetWeight, we might still need to fetch if it's not in context.
        // But let's check payload-types first.

        if (user.targetWeight) {
          setTargetWeight(user.targetWeight) // Already in kg
        }

        // Optimized fetch: depth=0 to avoid joining user object
        const response = await apiFetch<{ docs: BodyWeightLog[] }>(
          `/body-weight-logs?where[user][equals]=${user.id}&sort=-loggedAt&limit=50&depth=0`,
        )

        processAndSetLogs(response.docs, userUnit)
      } catch (error) {
        console.error('Error fetching weight logs:', error)
        showSnackbar({ message: 'Failed to load weight logs', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchWeightLogs()
  }, [user?.id, showSnackbar])

  const processAndSetLogs = (docs: BodyWeightLog[], unit: 'kg' | 'lb') => {
    const logsWithChanges = docs.map((log, index) => {
      const weightInKg = log.weight
      const displayWeight = fromKg(weightInKg, unit)

      const previousLog = docs[index + 1]
      let change = 0
      if (previousLog) {
        const prevWeightInKg = previousLog.weight
        const prevDisplayWeight = fromKg(prevWeightInKg, unit)
        change = displayWeight - prevDisplayWeight
      }

      return {
        id: log.id,
        date: new Date(log.loggedAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        rawDate: log.loggedAt,
        weight: displayWeight,
        rawWeight: weightInKg,
        change,
      }
    })
    setWeightLogs(logsWithChanges)
  }

  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : 0

  const handleSaveWeight = async (weight: number, date: Date) => {
    if (!user) return

    try {
      // Optimistic Update can be tricky with "change" calculation dependent on sort.
      // But we can insert at top and recalc.
      const weightInKg = toKg(weight, preferredUnit)

      // API call
      const response = await apiFetch<{ doc: BodyWeightLog }>('/body-weight-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user.id,
          weight: weightInKg,
          loggedAt: date.toISOString(),
        }),
      })

      showSnackbar({ message: 'Weight logged successfully', severity: 'success' })
      setIsPickerOpen(false)

      // Add new log to state without re-fetching
      const newLog = response.doc
      // We need to re-process the list because "change" values might shift if we insert in middle,
      // but usually logs are today, so top of list.
      // Let's verify date sorting. If new log is older than top, we need to sort.
      // Easiest is to reconstruct the "docs" array and re-run processAndSetLogs.

      const currentDocs: BodyWeightLog[] = weightLogs.map((l) => ({
        id: l.id,
        weight: l.rawWeight,
        loggedAt: l.rawDate,
        user: Number(user.id), // Cast to number to match BodyWeightLog type
        updatedAt: new Date().toISOString(), // Valid ISO string
        createdAt: new Date().toISOString(), // Valid ISO string
      }))

      const updatedDocs = [newLog, ...currentDocs].sort(
        (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
      )

      processAndSetLogs(updatedDocs, preferredUnit)
    } catch (error) {
      console.error('Error saving weight:', error)
      showSnackbar({ message: 'Failed to save weight', severity: 'error' })
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 12, // Increased from 4 to 12 to clear the fixed BottomNav
      }}
    >
      {/* Top AppBar with scroll elevation */}
      <AppBarWithScroll position="sticky" elevationTrigger={10}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Bodyweight Log
          </Typography>
        </Toolbar>
      </AppBarWithScroll>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Current Weight Card */}
        <Card
          elevation={1}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <MonitorWeight sx={{ color: 'primary.main', mr: 1, fontSize: '1.25rem' }} />
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700 }}>
                Current Weight
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1.5 }}>
              <Typography variant="h2" sx={{ color: 'text.primary', fontWeight: 800, mr: 0.5 }}>
                {currentWeight.toFixed(1)}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {preferredUnit}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {targetWeight ? (
                <>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Target: {formatWeight(targetWeight, preferredUnit)}
                    {preferredUnit}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {Math.abs(currentWeight - fromKg(targetWeight, preferredUnit)).toFixed(1)}
                    {preferredUnit} to go
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                  Set your target weight in settings
                </Typography>
              )}
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
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              mb: 2,
              textTransform: 'uppercase',
              fontSize: '1rem',
              letterSpacing: '0.02em',
            }}
          >
            History
          </Typography>

          <Card
            elevation={1}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            {loading ? (
              <List sx={{ p: 0 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <React.Fragment key={i}>
                    <ListItem sx={{ px: 2.5, py: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="40%" height={32} />
                      </Box>
                      <Skeleton
                        variant="rectangular"
                        width={70}
                        height={24}
                        sx={{ borderRadius: 1 }}
                      />
                    </ListItem>
                    {i < 5 && <Divider sx={{ mx: 2.5 }} />}
                  </React.Fragment>
                ))}
              </List>
            ) : weightLogs.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No weight logs yet. Tap the + button to add your first entry!
                </Typography>
              </Box>
            ) : (
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
                            sx={{ fontSize: '0.85rem', color: 'text.secondary', mr: 1 }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', fontWeight: 500 }}
                          >
                            {log.date}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 800 }}>
                          {log.weight.toFixed(1)}{' '}
                          <span
                            style={{ fontSize: '0.9rem', color: 'text.secondary', fontWeight: 500 }}
                          >
                            {preferredUnit}
                          </span>
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'right' }}>
                        {log.change !== 0 && (
                          <Chip
                            label={`${log.change > 0 ? '+' : ''}${log.change.toFixed(1)}${preferredUnit}`}
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
                      <Divider sx={{ bgcolor: 'divider', mx: 2.5, opacity: 0.5 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Card>
        </Box>
      </Container>

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setIsPickerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: isWorkoutActive ? 160 : 80,
          right: 16,
          zIndex: 1200,
        }}
      >
        <Add />
      </Fab>

      <BottomNav />
    </Box>
  )
}
