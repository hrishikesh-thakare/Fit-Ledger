'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  SkipNext,
  Close,
} from '@mui/icons-material'

export default function RestTimerPage() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(90)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => prev - 1)
      }, 1000)
    } else if (seconds === 0) {
      setIsRunning(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, seconds])

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartPause = () => {
    setIsRunning(!isRunning)
  }

  const handleSkip = () => {
    router.back()
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        px: 3,
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={() => router.back()}
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          color: '#888888',
        }}
      >
        <Close />
      </IconButton>

      {/* Rest Timer Label */}
      <Typography
        variant="body1"
        sx={{
          color: '#888888',
          mb: 2,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Rest Timer
      </Typography>

      {/* Timer Display */}
      <Box
        sx={{
          mb: 6,
          position: 'relative',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            color: seconds <= 10 && seconds > 0 ? '#f44336' : '#2196F3',
            fontSize: { xs: '7rem', sm: '9rem' },
            fontWeight: 'bold',
            fontFamily: 'monospace',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {formatTime(seconds)}
        </Typography>
        
        {seconds === 0 && (
          <Typography
            variant="h6"
            sx={{
              color: '#2196F3',
              textAlign: 'center',
              mt: 2,
              fontWeight: 600,
            }}
          >
            Rest Complete!
          </Typography>
        )}
      </Box>

      {/* Control Buttons */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
        }}
      >
        {/* Start/Pause Button */}
        <Button
          variant="contained"
          size="large"
          onClick={handleStartPause}
          startIcon={isRunning ? <Pause /> : <PlayArrow />}
          sx={{
            py: 1.75,
            px: 4,
            bgcolor: '#2196F3',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '1.1rem',
            textTransform: 'none',
            borderRadius: 3,
            minWidth: 150,
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
            '&:hover': {
              bgcolor: '#1976D2',
              boxShadow: '0 6px 16px rgba(33, 150, 243, 0.5)',
            },
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </Button>

        {/* Skip Button */}
        <Button
          variant="outlined"
          size="large"
          onClick={handleSkip}
          startIcon={<SkipNext />}
          sx={{
            py: 1.75,
            px: 4,
            color: '#888888',
            borderColor: '#333333',
            fontWeight: 600,
            fontSize: '1.1rem',
            textTransform: 'none',
            borderRadius: 3,
            '&:hover': {
              borderColor: '#2196F3',
              color: '#2196F3',
              bgcolor: 'rgba(33, 150, 243, 0.08)',
            },
          }}
        >
          Skip
        </Button>
      </Box>
    </Box>
  )
}
