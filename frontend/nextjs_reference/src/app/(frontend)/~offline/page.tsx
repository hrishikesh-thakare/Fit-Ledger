'use client'

import React from 'react'
import {
    Box,
    Typography,
    Button,
    Container,
} from '@mui/material'
import { CloudOff } from '@mui/icons-material'

export default function OfflinePage() {
    return (
        <Container
            maxWidth="sm"
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'background.default',
                px: 3,
            }}
        >
            <Box
                sx={{
                    p: 4,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    mb: 4,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <CloudOff sx={{ fontSize: 80, color: 'text.secondary' }} />
            </Box>

            <Typography
                variant="h4"
                component="h1"
                sx={{
                    fontWeight: 800,
                    color: 'text.primary',
                    textAlign: 'center',
                    mb: 2,
                }}
            >
                You&apos;re Offline
            </Typography>

            <Typography
                variant="body1"
                sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    mb: 2,
                    maxWidth: 400,
                }}
            >
                Don&apos;t worry — FitLedger still works offline! You can view your routines, log workouts, and track bodyweight.
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    color: 'text.disabled',
                    textAlign: 'center',
                    mb: 6,
                    maxWidth: 400,
                }}
            >
                Your data will sync automatically when you&apos;re back online.
            </Typography>

            <Button
                variant="contained"
                size="large"
                onClick={() => window.location.reload()}
                sx={{
                    py: 1.5,
                    px: 6,
                    borderRadius: 2,
                    fontWeight: 700,
                }}
            >
                Retry Connection
            </Button>
        </Container>
    )
}
