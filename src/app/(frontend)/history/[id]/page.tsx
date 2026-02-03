'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Paper,
} from '@mui/material'
import { ArrowBack, AccessTime, FitnessCenter, CalendarToday } from '@mui/icons-material'

// Mock Detailed Data
const workoutDetails = {
  id: 1,
  name: 'Leg Day A',
  date: 'October 23, 2023',
  startTime: '2:30 PM',
  endTime: '3:42 PM',
  duration: '01:12:45',
  volume: '14,250 lbs',
  formattedDate: 'Monday, Oct 23',
  exercises: [
    {
      id: 101,
      name: 'Barbell Squat',
      sets: [
        { id: 1, type: 'Warmup', weight: '135', reps: 12 },
        { id: 2, type: 'Working', weight: '225', reps: 8 },
        { id: 3, type: 'Working', weight: '245', reps: 6 },
        { id: 4, type: 'Working', weight: '265', reps: 4 },
      ],
    },
    {
      id: 102,
      name: 'Romanian Deadlift',
      sets: [
        { id: 1, type: 'Working', weight: '185', reps: 10 },
        { id: 2, type: 'Working', weight: '205', reps: 8 },
        { id: 3, type: 'Working', weight: '225', reps: 6 },
      ],
    },
    {
      id: 103,
      name: 'Lunges',
      sets: [
        { id: 1, type: 'Working', weight: '40', reps: 12 },
        { id: 2, type: 'Working', weight: '40', reps: 12 },
        { id: 3, type: 'Working', weight: '45', reps: 10 },
      ],
    },
  ],
}

export default function HistoryDetailPage() {
  const router = useRouter()
  // const params = useParams() // unused for mock

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 4,
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', top: 0 }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.back()}
            sx={{ color: 'text.primary', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            Workout Details
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ px: 2, pt: 3 }}>
        {/* Header Summary Card */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: '900',
              color: 'text.primary',
              mb: 0.5,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            {workoutDetails.name}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', mb: 3, display: 'flex', alignItems: 'center' }}
          >
            <CalendarToday sx={{ fontSize: '1rem', mr: 0.8, mb: 0.2 }} />
            {workoutDetails.date} • {workoutDetails.startTime}
          </Typography>

          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 'bold', letterSpacing: '0.05em' }}
              >
                DURATION
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <AccessTime sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {workoutDetails.duration}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 'bold', letterSpacing: '0.05em' }}
              >
                VOLUME
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <FitnessCenter sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {workoutDetails.volume}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Exercises List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {workoutDetails.exercises.map((exercise) => (
            <Card
              key={exercise.id}
              elevation={1}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {exercise.name}
                </Typography>
              </Box>

              {/* Set Table */}
              <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'background.paper' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 'bold',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          width: '20%',
                        }}
                      >
                        SET
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 'bold',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          width: '40%',
                        }}
                      >
                        WEIGHT &nbsp;
                        <Typography variant="caption" component="span" color="text.disabled">
                          (lbs)
                        </Typography>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 'bold',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          width: '40%',
                        }}
                      >
                        REPS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exercise.sets.map((set, index) => (
                      <TableRow
                        key={set.id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          bgcolor: 'transparent',
                        }}
                      >
                        <TableCell
                          align="center"
                          scope="row"
                          sx={{
                            color: set.type === 'Warmup' ? 'warning.main' : 'text.secondary',
                            fontSize: '0.9rem',
                            fontWeight: set.type === 'Warmup' ? 700 : 400,
                          }}
                        >
                          {set.type === 'Warmup' ? 'W' : index + 1}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: '600', fontSize: '1rem' }}>
                          {set.weight}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: '600', fontSize: '1rem' }}>
                          {set.reps}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Workout Completed
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
