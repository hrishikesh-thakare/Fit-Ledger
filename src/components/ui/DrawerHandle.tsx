'use client';

import React from 'react';
import { Box } from '@mui/material';

/**
 * Material Design Bottom Sheet Handle
 * Interactive drag indicator for bottom sheets
 */
const DrawerHandle = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 1.5,
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 4,
          bgcolor: 'text.disabled',
          borderRadius: 2,
          opacity: 0.4,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            opacity: 0.6,
            width: 40,
          },
        }}
      />
    </Box>
  );
};

export default DrawerHandle;
