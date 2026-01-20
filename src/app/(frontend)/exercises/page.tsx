'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  Search,
} from '@mui/icons-material'

export default function ExerciseSelectorPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  const filters = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

  const exercises = [
    { id: 1, name: 'Bench Press', category: 'Chest' },
    { id: 2, name: 'Incline Dumbbell Press', category: 'Chest' },
    { id: 3, name: 'Cable Flyes', category: 'Chest' },
    { id: 4, name: 'Pull-ups', category: 'Back' },
    { id: 5, name: 'Barbell Rows', category: 'Back' },
    { id: 6, name: 'Lat Pulldown', category: 'Back' },
    { id: 7, name: 'Deadlift', category: 'Back' },
    { id: 8, name: 'Squats', category: 'Legs' },
    { id: 9, name: 'Leg Press', category: 'Legs' },
    { id: 10, name: 'Romanian Deadlift', category: 'Legs' },
    { id: 11, name: 'Leg Curls', category: 'Legs' },
    { id: 12, name: 'Shoulder Press', category: 'Shoulders' },
    { id: 13, name: 'Lateral Raises', category: 'Shoulders' },
    { id: 14, name: 'Front Raises', category: 'Shoulders' },
    { id: 15, name: 'Bicep Curls', category: 'Arms' },
    { id: 16, name: 'Hammer Curls', category: 'Arms' },
    { id: 17, name: 'Tricep Pushdowns', category: 'Arms' },
    { id: 18, name: 'Overhead Tricep Extension', category: 'Arms' },
    { id: 19, name: 'Planks', category: 'Core' },
    { id: 20, name: 'Russian Twists', category: 'Core' },
    { id: 21, name: 'Crunches', category: 'Core' },
  ]

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = !selectedFilter || selectedFilter === 'All' || exercise.category === selectedFilter
    return matchesSearch && matchesFilter
  })

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="titleLarge" fontWeight="bold">
            Select Exercise
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ pb: 2 }}>
        {/* Search Field */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <TextField
            fullWidth
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="disabled" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Filter Chips */}
        <Box
          sx={{
            px: 2,
            pb: 2,
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          {filters.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              onClick={() => setSelectedFilter(filter === 'All' ? null : filter)}
              color={selectedFilter === filter || (filter === 'All' && !selectedFilter) ? 'primary' : 'default'}
              sx={{
                fontWeight: 600,
              }}
            />
          ))}
        </Box>

        {/* Exercise List */}
        <Box sx={{ bgcolor: 'background.default' }}>
          <List sx={{ p: 0 }}>
            {filteredExercises.map((exercise, index) => (
              <React.Fragment key={exercise.id}>
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    '&:active': {
                      bgcolor: 'action.selected',
                    },
                  }}
                  onClick={() => router.push(`/exercises/${exercise.id}`)}
                >
                  <ListItemText
                    primary={
                      <Typography variant="bodyLarge" fontWeight={500}>
                        {exercise.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="labelMedium" color="text.disabled">
                        {exercise.category}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < filteredExercises.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {/* Empty State */}
          {filteredExercises.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
              }}
            >
              <Search sx={{ fontSize: '3rem', color: 'text.disabled', mb: 2 }} />
              <Typography variant="titleMedium" color="text.secondary" sx={{ mb: 1 }}>
                No exercises found
              </Typography>
              <Typography variant="bodyMedium" color="text.disabled">
                Try adjusting your search or filters
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  )
}
