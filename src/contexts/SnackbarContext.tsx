'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react'

export interface SnackbarMessage {
  message: string
  severity?: 'success' | 'error' | 'warning' | 'info'
  action?: ReactNode
  duration?: number | null
}

interface SnackbarContextType {
  showSnackbar: (params: SnackbarMessage) => void
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

interface SnackbarState extends SnackbarMessage {
  key: number
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackPack, setSnackPack] = useState<readonly SnackbarState[]>([])
  const [open, setOpen] = useState(false)
  const [messageInfo, setMessageInfo] = useState<SnackbarState | undefined>(undefined)

  useEffect(() => {
    if (snackPack.length && !messageInfo) {
      // Set a new snack when we don't have an active one
      setMessageInfo({ ...snackPack[0] })
      setSnackPack((prev) => prev.slice(1))
      setOpen(true)
    } else if (snackPack.length && messageInfo && open) {
      // Close an active snack when a new one is added
      setOpen(false)
    }
  }, [snackPack, messageInfo, open])

  const showSnackbar = useCallback(
    ({ message, severity = 'info', action, duration = 4000 }: SnackbarMessage) => {
      setSnackPack((prev) => [
        ...prev,
        { message, severity, action, duration, key: new Date().getTime() },
      ])
    },
    [],
  )

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      // Don't close on clickaway for important or persistent messages
      return
    }
    setOpen(false)
  }

  const handleExited = () => {
    setMessageInfo(undefined)
  }

  const contextValue = useMemo(() => ({ showSnackbar }), [showSnackbar])

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      <GlobalSnackbar
        snackbar={{
          open,
          key: messageInfo ? messageInfo.key : 0,
          message: messageInfo ? messageInfo.message : '',
          severity: messageInfo?.severity,
          action: messageInfo?.action,
          duration: messageInfo?.duration,
        }}
        onClose={handleClose}
        onExited={handleExited}
      />
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider')
  }
  return context
}

// Import GlobalSnackbar component
import GlobalSnackbar from '@/components/GlobalSnackbar'
