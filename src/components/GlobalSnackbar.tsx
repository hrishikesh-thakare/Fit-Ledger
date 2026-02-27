'use client'

import React from 'react'
import { Snackbar, Alert, IconButton, Box } from '@mui/material'
import { Close } from '@mui/icons-material'
import { BOTTOM_NAV_HEIGHT } from '@/components/layout/constants'

interface GlobalSnackbarProps {
  snackbar: {
    open: boolean
    message: string
    severity?: 'success' | 'error' | 'warning' | 'info'
    action?: React.ReactNode
    duration?: number | null
    key: number
  }
  onClose: (event: React.SyntheticEvent | Event, reason?: string) => void
  onExited?: () => void
}

/**
 * Global Snackbar component for Material Design notifications
 * Positioned above BottomNav following Android patterns
 */
export default function GlobalSnackbar({ snackbar, onClose, onExited }: GlobalSnackbarProps) {
  const { open, message, severity, action, duration, key } = snackbar

  return (
    <Snackbar
      key={key}
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      TransitionProps={{ onExited }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      sx={{
        bottom: `calc(${BOTTOM_NAV_HEIGHT}px + 32px + env(safe-area-inset-bottom))`,
        left: 16,
        right: 16,
        '& .MuiSnackbarContent-root': {
          minWidth: 'auto',
        },
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {action}
            <IconButton size="small" color="inherit" onClick={onClose} sx={{ p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{
          width: '100%',
          alignItems: 'center', // Ensure vertical centering of Icon, Message, and Action
          bgcolor:
            severity === 'error'
              ? 'error.main'
              : severity === 'warning'
                ? 'warning.main'
                : severity === 'success'
                  ? 'success.main'
                  : 'info.main',
          color:
            severity === 'error'
              ? 'error.contrastText'
              : severity === 'warning'
                ? 'warning.contrastText'
                : severity === 'success'
                  ? 'success.contrastText'
                  : 'info.contrastText',
          '& .MuiAlert-icon': {
            color: 'inherit',
            py: 0, // Remove default padding to ensure centering
          },
          '& .MuiAlert-message': {
            py: 0, // Ensure message is centered
          },
          '& .MuiAlert-action': {
            py: 0,
            pt: 0, // Override potential default top padding
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}
