import React from 'react'
import { Card, CardContent, Box, Skeleton, Divider } from '@mui/material'

export default function RoutineCardSkeleton() {
  return (
    <Card
      elevation={1}
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        mb: 2,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header: Name + Overflow Menu */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
        >
          <Box>
            <Skeleton variant="text" width={160} height={32} sx={{ mb: 1.5 }} />
            {/* Muscle group chips */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Box>

        <Divider sx={{ my: 1.5, opacity: 0.5 }} />

        {/* Preview exercises text */}
        <Skeleton variant="text" width="85%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />

        {/* Footer: Exercise count + Start button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={140} height={20} />
          <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 4 }} />
        </Box>
      </CardContent>
    </Card>
  )
}
