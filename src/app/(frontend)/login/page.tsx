'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - just redirect for now
    router.push('/dashboard')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 2,
      }}
    >
      <Container 
        maxWidth="xs"
        disableGutters
        sx={{ width: '100%', maxWidth: '400px' }}
      >
        <Box sx={{ p: 3, width: '100%' }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography 
              variant="headlineMedium" 
              component="h1" 
              fontWeight="bold" 
              gutterBottom
            >
              FitLedger
            </Typography>
            <Typography variant="bodyMedium" color="text.secondary">
              Track your fitness journey
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="bodyMedium" color="text.secondary">
                Don&apos;t have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  onClick={() => router.push('/signup')}
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { 
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </form>
        </Box>
      </Container>
    </Box>
  )
}
