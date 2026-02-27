'use client'

import React from 'react'
import { Box, CircularProgress } from '@mui/material'

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  threshold?: number
}

/**
 * Visual indicator for pull-to-refresh gesture.
 * Shows a downward arrow that rotates into a spinner when released.
 */
export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !isRefreshing) return null

  const progress = Math.min(1, pullDistance / threshold)

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: isRefreshing ? 48 : pullDistance * 0.6,
        overflow: 'hidden',
        transition: isRefreshing ? 'height 0.3s ease' : 'none',
      }}
    >
      {isRefreshing ? (
        <CircularProgress size={24} thickness={4} />
      ) : (
        <CircularProgress
          variant="determinate"
          value={progress * 100}
          size={24}
          thickness={4}
          sx={{
            color: progress >= 1 ? 'primary.main' : 'text.secondary',
            opacity: Math.min(1, progress * 1.5),
          }}
        />
      )}
    </Box>
  )
}
