'use client'

import React, { ReactNode } from 'react'
import { Toolbar, Typography, IconButton } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import AppBarWithScroll from '@/components/AppBarWithScroll'

interface PageAppBarProps {
  title: string
  onBack?: () => void
  leading?: ReactNode
  actions?: ReactNode
  elevationTrigger?: number
  safeAreaTop?: boolean
}

export default function PageAppBar({
  title,
  onBack,
  leading,
  actions,
  elevationTrigger = 10,
  safeAreaTop = true,
}: PageAppBarProps) {
  return (
    <AppBarWithScroll
      position="sticky"
      elevationTrigger={elevationTrigger}
      sx={safeAreaTop ? { pt: 'env(safe-area-inset-top)' } : undefined}
    >
      <Toolbar>
        {onBack && (
          <IconButton edge="start" onClick={onBack} sx={{ color: 'text.primary', mr: 1 }}>
            {leading || <ArrowBack />}
          </IconButton>
        )}
        <Typography
          variant="h6"
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            flexGrow: 1,
          }}
        >
          {title}
        </Typography>
        {actions}
      </Toolbar>
    </AppBarWithScroll>
  )
}
