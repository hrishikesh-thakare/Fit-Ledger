'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'
import { Dashboard, FitnessCenter, History, Person, MonitorWeight } from '@mui/icons-material'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'
import { BOTTOM_NAV_HEIGHT } from '@/components/layout/constants'

const routes = ['/dashboard', '/routines', '/history', '/bodyweight', '/profile']

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { isActive: isWorkoutActive } = useWorkoutSession()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)

  const getActiveIndex = React.useCallback(() => {
    if (pathname === '/dashboard') return 0
    if (pathname.startsWith('/routines')) return 1
    if (pathname.startsWith('/history')) return 2
    if (pathname === '/bodyweight') return 3
    if (pathname === '/profile') return 4
    return 0
  }, [pathname])

  const [value, setValue] = React.useState(getActiveIndex())

  React.useEffect(() => {
    setValue(getActiveIndex())
  }, [pathname, getActiveIndex])

  const handleNavChange = (event: React.SyntheticEvent, newValue: number) => {
    const targetRoute = routes[newValue]

    // If workout is active and navigating away from workout page, show confirmation
    if (isWorkoutActive && pathname.startsWith('/workout') && !targetRoute.startsWith('/workout')) {
      setPendingRoute(targetRoute)
      setConfirmOpen(true)
      return
    }

    setValue(newValue)
    router.push(targetRoute)
  }

  const handleConfirmLeave = () => {
    setConfirmOpen(false)
    if (pendingRoute) {
      router.push(pendingRoute)
      setPendingRoute(null)
    }
  }

  const handleCancelLeave = () => {
    setConfirmOpen(false)
    setPendingRoute(null)
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1000,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <BottomNavigation
          value={value}
          onChange={handleNavChange}
          showLabels
          sx={{
            height: BOTTOM_NAV_HEIGHT,
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              color: 'text.secondary',
              minWidth: 'auto',
              padding: '6px 0',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: 'primary.main',
                transform: 'scale(1.05)',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 500,
              '&.Mui-selected': {
                fontSize: '0.75rem',
                fontWeight: 700,
              },
            },
          }}
        >
          <BottomNavigationAction label="Dashboard" icon={<Dashboard />} />
          <BottomNavigationAction label="Routines" icon={<FitnessCenter />} />
          <BottomNavigationAction label="History" icon={<History />} />
          <BottomNavigationAction label="Weight" icon={<MonitorWeight />} />
          <BottomNavigationAction label="Profile" icon={<Person />} />
        </BottomNavigation>
      </Box>

      {/* Workout Active Navigation Guard */}
      <Dialog
        open={confirmOpen}
        onClose={handleCancelLeave}
        PaperProps={{
          sx: { borderRadius: 3, bgcolor: 'background.paper', m: 2 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Leave Workout?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary' }}>
            You have a workout in progress. Your progress is saved and you can return anytime via
            the floating bar.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCancelLeave} sx={{ fontWeight: 600, color: 'text.primary' }}>
            Stay
          </Button>
          <Button
            onClick={handleConfirmLeave}
            variant="contained"
            disableElevation
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
