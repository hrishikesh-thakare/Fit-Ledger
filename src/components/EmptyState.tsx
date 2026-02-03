'use client';

import React, { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Material Design Empty State Component
 * Displays when lists or content areas are empty
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 3,
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          fontSize: '4rem',
          color: 'text.disabled',
          opacity: 0.3,
          mb: 3,
          '& > svg': {
            fontSize: 'inherit',
          },
        }}
      >
        {icon}
      </Box>

      {/* Title */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: 'text.secondary',
          mb: description ? 1 : 2,
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.disabled',
            mb: action ? 3 : 0,
            maxWidth: 320,
          }}
        >
          {description}
        </Typography>
      )}

      {/* Action */}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
