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
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock signup - just redirect for now
    router.push('/login')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#000000',
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
              variant="h4" 
              component="h1" 
              fontWeight="bold" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.75rem', sm: '2rem' },
                color: '#ffffff',
              }}
            >
              FitLedger
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ color: '#888888' }}
            >
              Create your account
            </Typography>
          </Box>

          <form onSubmit={handleSignUp}>
            <TextField
              fullWidth
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#2196F3' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem',
                  color: '#ffffff',
                  bgcolor: '#1a1a1a',
                  '& fieldset': {
                    borderColor: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#888888',
                  '&.Mui-focused': {
                    color: '#2196F3',
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#2196F3' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem',
                  color: '#ffffff',
                  bgcolor: '#1a1a1a',
                  '& fieldset': {
                    borderColor: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#888888',
                  '&.Mui-focused': {
                    color: '#2196F3',
                  },
                },
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
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#2196F3' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="large"
                      sx={{ color: '#888888' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem',
                  color: '#ffffff',
                  bgcolor: '#1a1a1a',
                  '& fieldset': {
                    borderColor: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#888888',
                  '&.Mui-focused': {
                    color: '#2196F3',
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#2196F3' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="large"
                      sx={{ color: '#888888' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem',
                  color: '#ffffff',
                  bgcolor: '#1a1a1a',
                  '& fieldset': {
                    borderColor: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#888888',
                  '&.Mui-focused': {
                    color: '#2196F3',
                  },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.75,
                minHeight: 52,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1,
                bgcolor: '#2196F3',
                color: '#ffffff',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#1976D2',
                  boxShadow: 'none',
                },
              }}
            >
              Sign Up
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#888888' }}>
                Already have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  onClick={() => router.push('/login')}
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: '#2196F3',
                    '&:hover': { 
                      textDecoration: 'underline',
                      color: '#1976D2',
                    },
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </form>
        </Box>
      </Container>
    </Box>
  )
}
