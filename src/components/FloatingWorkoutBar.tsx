'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'
import { KeyboardArrowUp, DeleteOutline } from '@mui/icons-material'
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext'
import { useSnackbar } from '@/hooks/useSnackbar'
import { useAuth } from '@/contexts/AuthContext'
import { BOTTOM_NAV_HEIGHT } from '@/components/layout/constants'

export default function FloatingWorkoutBar() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    isActive,
    routineName,
    routineId,
    getElapsedSeconds,
    endSession,
  } = useWorkoutSession()
  const { showSnackbar } = useSnackbar()
  const { user, loading } = useAuth()

  const [elapsed, setElapsed] = useState(0)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)

  // Live timer — refinement #4: proper cleanup
  useEffect(() => {
    if (!isActive) return
    setElapsed(getElapsedSeconds())
    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds())
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive, getElapsedSeconds])

  // Don't render if no active workout or not logged in
  if (!isActive || loading || !user) return null

  // Hide on all workout-related pages (logging, summary, etc.)
  if (pathname?.startsWith('/workout')) return null

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleDiscard = () => {
    endSession()
    setDiscardDialogOpen(false)
    showSnackbar({ message: 'Workout discarded', severity: 'info' })
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: BOTTOM_NAV_HEIGHT + 18,
          left: 0,
          right: 0,
          zIndex: 1200,
          userSelect: 'none',
        }}
      >
        <Box
          sx={{
            mx: 1,
            px: 1,
            py: 0.5,
            bgcolor: 'primary.main',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            boxShadow: 3,
          }}
        >
          {/* Up arrow — navigate to workout */}
          <IconButton
            size="small"
            onClick={() => router.push(`/workout?routineId=${routineId}`)}
            sx={{
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <KeyboardArrowUp sx={{ fontSize: '2rem' }} />
          </IconButton>

          {/* Center info — also tappable to navigate */}
          <Box
            onClick={() => router.push(`/workout?routineId=${routineId}`)}
            sx={{
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'primary.contrastText',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Workout In Progress
              </Typography>
            </Box>

            {/* Timer */}
            <Typography
              variant="body1"
              sx={{
                color: 'primary.contrastText',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}
            >
              {formatTime(elapsed)}
            </Typography>
          </Box>

          {/* Discard button */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              setDiscardDialogOpen(true)
            }}
            sx={{
              color: 'error.main',
              '&:hover': {
                color: 'error.light',
                bgcolor: 'action.hover',
              },
            }}
          >
            <DeleteOutline sx={{ fontSize: '1.75rem' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Discard Confirmation Dialog */}
      <Dialog open={discardDialogOpen} onClose={() => setDiscardDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Discard Workout?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            All progress for <strong>{routineName}</strong> will be lost. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDiscard} color="error" variant="contained">
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
