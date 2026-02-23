'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Skeleton,
  Fade,
} from '@mui/material'
import { FitnessCenter, CloudDownload, Edit, ChevronRight, Info, Flag } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import apiFetch from '@/lib/api/client'
import { useSnackbar } from '@/hooks/useSnackbar'
import { toKg, fromKg, formatWeight } from '@/lib/utils/weightConversion'
import AppScaffold from '@/components/layout/AppScaffold'
import PageContainer from '@/components/layout/PageContainer'
import PageAppBar from '@/components/PageAppBar'
import type { User } from '@/payload-types'

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth()
  const { showSnackbar } = useSnackbar()

  // User data State
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Settings State
  const [units, setUnits] = useState<'kg' | 'lb'>('kg')

  // Target Weight Dialog State
  const [targetWeightDialogOpen, setTargetWeightDialogOpen] = useState(false)
  const [targetWeight, setTargetWeight] = useState('')
  const [savingTargetWeight, setSavingTargetWeight] = useState(false)

  // Edit Profile Dialog State
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await apiFetch(`/users/${authUser.id}`)

        setUserData(response)
        setUnits(response.preferredUnit || 'kg')
        setDisplayName(response.displayName || '')
        if (response.targetWeight) {
          // Convert from kg (database) to user's preferred unit for display
          const displayWeight = fromKg(response.targetWeight, response.preferredUnit || 'kg')
          setTargetWeight(displayWeight.toString())
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        showSnackbar({ message: 'Failed to load profile data', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [authUser, showSnackbar])

  const handleUnitsChange = async (newUnits: 'kg' | 'lb') => {
    if (!authUser) return

    try {
      setUnits(newUnits)
      await apiFetch(`/users/${authUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ preferredUnit: newUnits }),
      })
      showSnackbar({ message: 'Units updated successfully', severity: 'success' })
    } catch (error) {
      console.error('Failed to update units:', error)
      showSnackbar({ message: 'Failed to update units', severity: 'error' })
      setUnits(units) // Revert on error
    }
  }

  const handleSaveTargetWeight = async () => {
    if (!authUser) return

    const weight = parseFloat(targetWeight)
    if (isNaN(weight) || weight <= 0) {
      showSnackbar({ message: 'Please enter a valid weight', severity: 'error' })
      return
    }

    try {
      setSavingTargetWeight(true)
      // Convert user input (in their preferred unit) to kg for database
      const weightInKg = toKg(weight, units)

      await apiFetch(`/users/${authUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ targetWeight: weightInKg }),
      })
      if (userData) setUserData({ ...userData, targetWeight: weightInKg })
      showSnackbar({ message: 'Target weight updated successfully', severity: 'success' })
      setTargetWeightDialogOpen(false)
    } catch (error) {
      console.error('Failed to update target weight:', error)
      showSnackbar({ message: 'Failed to update target weight', severity: 'error' })
    } finally {
      setSavingTargetWeight(false)
    }
  }

  const handleOpenTargetWeightDialog = () => {
    if (userData?.targetWeight) {
      // Convert from kg (database) to user's preferred unit for editing
      const displayWeight = fromKg(userData.targetWeight, units)
      setTargetWeight(displayWeight.toString())
    } else {
      setTargetWeight('')
    }
    setTargetWeightDialogOpen(true)
  }

  const handleOpenEditProfileDialog = () => {
    setDisplayName(userData?.displayName || '')
    setEditProfileDialogOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!authUser) return

    if (!displayName.trim()) {
      showSnackbar({ message: 'Please enter a display name', severity: 'error' })
      return
    }

    try {
      setSavingProfile(true)
      await apiFetch(`/users/${authUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ displayName: displayName.trim() }),
      })
      if (userData) setUserData({ ...userData, displayName: displayName.trim() })
      showSnackbar({ message: 'Profile updated successfully', severity: 'success' })
      setEditProfileDialogOpen(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      showSnackbar({ message: 'Failed to update profile', severity: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <AppScaffold showBottomNav>
      {/* Top AppBar */}
      <PageAppBar title="Profile" />

      <PageContainer>
        {/* User Info Card */}
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
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            {loading ? (
              <>
                <Skeleton
                  variant="circular"
                  width={80}
                  height={80}
                  sx={{ margin: '0 auto', mb: 2 }}
                />
                <Skeleton variant="text" width="60%" height={32} sx={{ margin: '0 auto', mb: 1 }} />
                <Skeleton variant="text" width="40%" height={24} sx={{ margin: '0 auto', mb: 2 }} />
                <Skeleton variant="text" width="50%" height={20} sx={{ margin: '0 auto' }} />
              </>
            ) : (
              <Fade in timeout={400}>
                <Box>
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
                    {userData?.displayName
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('') || authUser?.email?.[0].toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                    {userData?.displayName || authUser?.email}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {authUser?.email}
                  </Typography>

                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Member since{' '}
                    {userData?.createdAt
                      ? new Date(userData.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : userData?.updatedAt
                        ? new Date(userData.updatedAt).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'N/A'}
                  </Typography>
                </Box>
              </Fade>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Edit Profile Button (Inside Card) */}
            <ListItem
              onClick={handleOpenEditProfileDialog}
              sx={{
                cursor: 'pointer',
                py: 1,
                px: 2,
                borderRadius: 1.5,
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
            elevation={1}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
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
                    sx: { color: 'text.primary', fontWeight: 500, fontSize: '1rem' },
                  }}
                />
                <Select
                  value={units}
                  onChange={(e) => handleUnitsChange(e.target.value as 'kg' | 'lb')}
                  size="small"
                  disabled={loading}
                  sx={{
                    color: 'text.primary',
                    bgcolor: 'background.paper',
                    fontSize: '0.875rem',
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

              <Divider sx={{ bgcolor: 'divider' }} />

              <ListItem
                onClick={handleOpenTargetWeightDialog}
                sx={{
                  cursor: 'pointer',
                  py: 1.5,
                  '&:active': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Flag sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Target Weight"
                  secondary={
                    userData?.targetWeight
                      ? `${formatWeight(userData.targetWeight, units)} ${units}`
                      : 'Not set'
                  }
                  primaryTypographyProps={{
                    sx: { color: 'text.primary', fontWeight: 500, fontSize: '1rem' },
                  }}
                  secondaryTypographyProps={{
                    sx: { color: 'text.secondary', fontSize: '0.875rem' },
                  }}
                />
                <ChevronRight sx={{ color: 'text.disabled', fontSize: '1.25rem' }} />
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
            elevation={1}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
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
                    sx: { color: 'text.primary', fontWeight: 500, fontSize: '1rem' },
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
            elevation={1}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
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
                    sx: { color: 'text.primary', fontWeight: 500, fontSize: '1rem' },
                  }}
                />
                <ChevronRight sx={{ color: 'text.disabled', fontSize: '1.25rem' }} />
              </ListItem>
            </List>
          </Card>
        </Box>

        {/* Logout Section */}
        <Box sx={{ mb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={logout}
            sx={{
              bgcolor: 'error.dark',
              color: 'common.white',
              py: 1.5,
              fontWeight: 600,
              fontSize: '1rem',
              textAlign: 'center',
              borderRadius: 1.5,
              '&:hover': {
                bgcolor: 'error.main',
              },
            }}
          >
            Log Out
          </Button>
        </Box>

        {/* App Version */}
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            FitLedger v1.0.0
          </Typography>
        </Box>
      </PageContainer>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editProfileDialogOpen}
        onClose={() => !savingProfile && setEditProfileDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Display Name"
            type="text"
            fullWidth
            variant="outlined"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={savingProfile}
            helperText="This name will be displayed on your profile"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileDialogOpen(false)} disabled={savingProfile}>
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} variant="contained" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Target Weight Dialog */}
      <Dialog
        open={targetWeightDialogOpen}
        onClose={() => !savingTargetWeight && setTargetWeightDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Set Target Weight</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Target Weight"
            type="number"
            fullWidth
            variant="outlined"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            disabled={savingTargetWeight}
            InputProps={{
              endAdornment: (
                <Typography sx={{ color: 'text.secondary', ml: 1 }}>{units}</Typography>
              ),
            }}
            helperText="Enter your target body weight goal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTargetWeightDialogOpen(false)} disabled={savingTargetWeight}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTargetWeight}
            variant="contained"
            disabled={savingTargetWeight}
          >
            {savingTargetWeight ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScaffold>
  )
}
