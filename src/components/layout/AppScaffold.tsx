'use client'

import React, { ReactNode } from 'react'
import { Box } from '@mui/material'
import BottomNav from '@/components/BottomNav'
import { BOTTOM_NAV_HEIGHT } from './constants'

interface AppScaffoldProps {
  children: ReactNode
  showBottomNav?: boolean
  contentPaddingBottom?: number | string
  bottomBar?: ReactNode
}

export default function AppScaffold({
  children,
  showBottomNav = false,
  contentPaddingBottom,
  bottomBar,
}: AppScaffoldProps) {
  const resolvedPaddingBottom =
    contentPaddingBottom ??
    (showBottomNav
      ? `calc(${BOTTOM_NAV_HEIGHT}px + 16px + env(safe-area-inset-bottom))`
      : 0)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ pb: resolvedPaddingBottom }}>{children}</Box>
      {bottomBar}
      {showBottomNav && <BottomNav />}
    </Box>
  )
}
