'use client';

import React from 'react';
import { Fab, FabProps } from '@mui/material';

interface SimpleFabProps extends Omit<FabProps, 'sx'> {
  bottom?: number | string;
}

/**
 * Simple Floating Action Button
 * Positioned fixed at bottom-right, above BottomNav
 */
export default function SimpleFab({ bottom, ...props }: SimpleFabProps) {
  return (
    <Fab
      color="primary"
      size="large"
      {...props}
      sx={{
        position: 'fixed',
        right: 16,
        bottom: bottom || 'calc(72px + 16px + env(safe-area-inset-bottom))',
        zIndex: 1050,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  );
}
