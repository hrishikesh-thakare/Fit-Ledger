import React from 'react'
import { Card, CardContent, Box, Skeleton, Divider } from '@mui/material'

export default function RoutineCardSkeleton() {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        mb: 1.5,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Header: Name + Arrow */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
        >
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="circular" width={24} height={24} />
        </Box>

        {/* Description */}
        <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2.5 }} />

        <Divider sx={{ borderColor: 'divider', mb: 2.5, opacity: 0.5 }} />

        {/* Metrics Row */}
        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Exercises */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" width={60} height={16} />
            </Box>
            <Skeleton variant="text" width={20} height={32} />
          </Box>

          {/* Duration */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" width={60} height={16} />
            </Box>
            <Skeleton variant="text" width={80} height={32} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
