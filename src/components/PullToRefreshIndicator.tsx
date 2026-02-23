'use client'

import React from 'react'
import { Box, CircularProgress } from '@mui/material'
import { ArrowDownward } from '@mui/icons-material'

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
  const rotation = progress * 180

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
        <ArrowDownward
          sx={{
            fontSize: 24,
            color: progress >= 1 ? 'primary.main' : 'text.secondary',
            transform: `rotate(${rotation}deg)`,
            transition: 'color 0.2s ease',
            opacity: Math.min(1, progress * 1.5),
          }}
        />
      )}
    </Box>
  )
}
