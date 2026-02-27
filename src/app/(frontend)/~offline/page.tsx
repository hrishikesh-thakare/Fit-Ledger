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
                You are Offline
            </Typography>

            <Typography
                variant="body1"
                sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    mb: 6,
                    maxWidth: 400,
                }}
            >
                You have lost your internet connection. Please check your network settings and try again to sync your progress.
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
