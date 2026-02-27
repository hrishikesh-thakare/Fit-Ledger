'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import apiFetch from '@/lib/api/client'
import type { BodyWeightLog } from '@/payload-types'
import { useSnackbar } from '@/hooks/useSnackbar'
import { toKg, fromKg, formatWeight } from '@/lib/utils/weightConversion'
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Fab,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  SwipeableDrawer,
  Fade,
} from '@mui/material'
import {
  CalendarToday,
  MonitorWeight,
  Add,
  MoreVert,
  Edit,
  DeleteOutline,
} from '@mui/icons-material'
import AppScaffold from '@/components/layout/AppScaffold'
import PageContainer from '@/components/layout/PageContainer'
import WeightPicker from '@/components/WeightPicker'
import PageAppBar from '@/components/PageAppBar'
import DrawerHandle from '@/components/ui/DrawerHandle'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'
import { useExtendedFab } from '@/hooks/useExtendedFab'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator'

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
  const { visible: fabVisible } = useExtendedFab(50)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [weightLogs, setWeightLogs] = useState<ProcessedLog[]>([])
  const [loading, setLoading] = useState(true)
  const [targetWeight, setTargetWeight] = useState<number | null>(null)
  const [preferredUnit, setPreferredUnit] = useState<'kg' | 'lb'>('kg')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ProcessedLog | null>(null)
  const [editPickerOpen, setEditPickerOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      // Use user profile from context
      const userUnit = user.preferredUnit || 'kg'
      setPreferredUnit(userUnit)

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
    }
  }, [user, showSnackbar])

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

  const { isRefreshing, pullDistance } = usePullToRefresh({ onRefresh: fetchData })

  useEffect(() => {
    const fetchWeightLogs = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        await fetchData()
      } finally {
        setLoading(false)
      }
    }

    fetchWeightLogs()
  }, [user, fetchData, showSnackbar])

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

  const handleDeleteLog = async () => {
    if (!selectedLog || !user) return

    try {
      setIsDeleting(true)
      await apiFetch(`/body-weight-logs/${selectedLog.id}`, { method: 'DELETE' })

      // Remove the deleted log and recalculate changes
      const remainingDocs: BodyWeightLog[] = weightLogs
        .filter((l) => l.id !== selectedLog.id)
        .map((l) => ({
          id: l.id,
          weight: l.rawWeight,
          loggedAt: l.rawDate,
          user: Number(user.id),
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }))

      processAndSetLogs(remainingDocs, preferredUnit)
      showSnackbar({ message: 'Entry deleted', severity: 'success' })
      setEditPickerOpen(false)
      setSelectedLog(null)
    } catch (error) {
      console.error('Error deleting weight log:', error)
      showSnackbar({ message: 'Failed to delete entry', severity: 'error' })
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  const handleEditLog = async (newWeight: number, newDate: Date) => {
    if (!selectedLog || !user) return

    try {
      const weightInKg = toKg(newWeight, preferredUnit)

      await apiFetch(`/body-weight-logs/${selectedLog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: weightInKg,
          loggedAt: newDate.toISOString(),
        }),
      })

      // Update the log in state and recalculate
      const updatedDocs: BodyWeightLog[] = weightLogs.map((l) => ({
        id: l.id,
        weight: l.id === selectedLog.id ? weightInKg : l.rawWeight,
        loggedAt: l.id === selectedLog.id ? newDate.toISOString() : l.rawDate,
        user: Number(user.id),
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }))

      // Re-sort since date might have changed
      updatedDocs.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())

      processAndSetLogs(updatedDocs, preferredUnit)
      showSnackbar({ message: 'Entry updated', severity: 'success' })
      setEditPickerOpen(false)
      setSelectedLog(null)
    } catch (error) {
      console.error('Error updating weight log:', error)
      showSnackbar({ message: 'Failed to update entry', severity: 'error' })
    }
  }

  return (
    <AppScaffold showBottomNav>
      {/* Top AppBar with scroll elevation */}
      <PageAppBar title="Body Weight" />

      <PageContainer>
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
              <Typography variant="h2" sx={{ color: 'text.primary', fontWeight: 700, mr: 0.5 }}>
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
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              mb: 2,
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
              <Fade in timeout={400}>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No weight logs yet. Tap the + button to add your first entry!
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <Fade in timeout={400}>
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
                              sx={{ fontSize: '0.875rem', color: 'text.secondary', mr: 1 }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ color: 'text.secondary', fontWeight: 500 }}
                            >
                              {log.date}
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                            {log.weight.toFixed(1)}{' '}
                            <Typography
                              component="span"
                              sx={{
                                fontSize: '0.875rem',
                                color: 'text.secondary',
                                fontWeight: 500,
                              }}
                            >
                              {preferredUnit}
                            </Typography>
                          </Typography>
                        </Box>

                        <Box
                          sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          {log.change !== 0 && (
                            <Chip
                              label={`${log.change > 0 ? '+' : ''}${log.change.toFixed(1)}${preferredUnit}`}
                              size="small"
                              variant="filled"
                              sx={{
                                bgcolor: 'action.hover',
                                color: log.change < 0 ? 'error.main' : 'success.main',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
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
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                border: 'none',
                              }}
                            />
                          )}
                          <IconButton
                            onClick={() => {
                              setSelectedLog(log)
                              setDrawerOpen(true)
                            }}
                            sx={{ color: 'text.disabled', minWidth: 44, minHeight: 44 }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </ListItem>
                      {index < weightLogs.length - 1 && (
                        <Divider sx={{ bgcolor: 'divider', mx: 2.5, opacity: 0.5 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </Fade>
            )}
          </Card>
        </Box>
      </PageContainer>

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setIsPickerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: isWorkoutActive
            ? 'calc(72px + 16px + 80px + env(safe-area-inset-bottom))'
            : 'calc(72px + 16px + env(safe-area-inset-bottom))',
          right: 16,
          zIndex: 1050,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: fabVisible ? 1 : 0,
          transform: fabVisible ? 'scale(1)' : 'scale(0.8)',
          pointerEvents: fabVisible ? 'auto' : 'none',
        }}
      >
        <Add />
      </Fab>

      {/* Options Bottom Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => { }}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            bgcolor: 'surfaceContainer',
            pb: 'env(safe-area-inset-bottom)',
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            color: 'text.primary',
            pb: 4,
          }}
          role="presentation"
        >
          <DrawerHandle />

          {selectedLog && (
            <Box sx={{ px: 2, pt: 1, pb: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {selectedLog.date}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selectedLog.weight.toFixed(1)} {preferredUnit}
              </Typography>
            </Box>
          )}

          <Box sx={{ px: 2 }}>
            <List
              disablePadding
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setDrawerOpen(false)
                    setEditPickerOpen(true)
                  }}
                  sx={{ py: 2, px: 3 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Edit sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText primary="Edit" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>

              <Divider sx={{ mx: 2, opacity: 0.5 }} />

              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setDrawerOpen(false)
                    setDeleteConfirmOpen(true)
                  }}
                  sx={{ py: 2, px: 3 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <DeleteOutline sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Delete"
                    primaryTypographyProps={{ fontWeight: 600, color: 'error.main' }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Entry?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this weight log? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={isDeleting}
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteLog}
            color="error"
            disabled={isDeleting}
            autoFocus
            sx={{ fontWeight: 600 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Weight Picker */}
      {selectedLog && (
        <WeightPicker
          open={editPickerOpen}
          onClose={() => {
            setEditPickerOpen(false)
            setSelectedLog(null)
          }}
          onSave={handleEditLog}
          initialWeight={selectedLog.weight}
          initialDate={new Date(selectedLog.rawDate)}
        />
      )}
    </AppScaffold>
  )
}
