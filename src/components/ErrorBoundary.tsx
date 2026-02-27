'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Container } from '@mui/material'
import { CloudOff } from '@mui/icons-material'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  isOffline: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  }

  private handleOnline = () => {
    if (this.state.hasError && this.state.isOffline) {
      this.setState({ hasError: false, isOffline: false })
    } else {
      this.setState({ isOffline: false })
    }
  }

  private handleOffline = () => {
    this.setState({ isOffline: true })
  }

  public componentDidMount() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  public componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
  }

  public static getDerivedStateFromError(_: Error): Partial<State> {
    return {
      hasError: true,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError && this.state.isOffline) {
      return (
        <Container
          maxWidth="sm"
          sx={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: 3,
          }}
        >
          <Box
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: 'action.hover',
              mb: 4,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CloudOff sx={{ fontSize: 80, color: 'text.secondary' }} />
          </Box>

          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 800, color: 'text.primary', textAlign: 'center', mb: 2 }}
          >
            You are Offline
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', textAlign: 'center', mb: 6, maxWidth: 400 }}
          >
            Check your internet connection and try again.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => window.location.reload()}
            sx={{ py: 1.5, px: 6, borderRadius: 2, fontWeight: 700 }}
          >
            Retry
          </Button>
        </Container>
      )
    }

    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
          <Box
            sx={{
              p: 4,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h5" component="h1" gutterBottom fontWeight="700">
              Something went wrong.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We encountered an unexpected error. Please try refreshing the page.
            </Typography>
            <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
              Refresh Page
            </Button>
          </Box>
        </Container>
      )
    }

    return this.props.children
  }
}
