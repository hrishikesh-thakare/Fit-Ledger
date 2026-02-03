'use client'

import React from 'react'
import { Box, Typography, Toolbar } from '@mui/material'
import BottomNav from '@/components/BottomNav'
import AppBarWithScroll from '@/components/AppBarWithScroll'

export default function DashboardPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 10,
      }}
    >
      {/* Top AppBar with scroll elevation */}
      <AppBarWithScroll position="sticky" elevationTrigger={10}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Dashboard
          </Typography>
        </Toolbar>
      </AppBarWithScroll>

      <h1 style={{ textAlign: 'center', marginTop: '50px' }}>Coming Soon!</h1>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  )
}
