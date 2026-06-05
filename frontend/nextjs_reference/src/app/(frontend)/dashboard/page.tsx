'use client'

import React from 'react'
import { Typography } from '@mui/material'
import AppScaffold from '@/components/layout/AppScaffold'
import PageAppBar from '@/components/PageAppBar'

export default function DashboardPage() {
  return (
    <AppScaffold showBottomNav>
      <PageAppBar title="Dashboard" />

      <Typography variant="h5" sx={{ textAlign: 'center', mt: 6, color: 'text.secondary' }}>
        Coming Soon!
      </Typography>
    </AppScaffold>
  )
}
