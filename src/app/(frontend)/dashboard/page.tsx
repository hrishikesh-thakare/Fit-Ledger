'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  Divider,
  Stack,
} from '@mui/material'
import { FitnessCenter } from '@mui/icons-material'
import BottomNav from '@/components/BottomNav'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 10,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="titleLarge" sx={{ fontWeight: 'bold' }}>
            Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <h1 style={{ textAlign: 'center', marginTop: '50px' }}>Coming Soon!</h1>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  )
}
