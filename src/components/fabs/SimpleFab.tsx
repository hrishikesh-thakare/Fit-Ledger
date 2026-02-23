'use client';

import React from 'react';
import { Fab, FabProps } from '@mui/material';
import { BOTTOM_NAV_HEIGHT } from '@/components/layout/constants';
import { useExtendedFab } from '@/hooks/useExtendedFab';

interface SimpleFabProps extends Omit<FabProps, 'sx'> {
  bottom?: number | string;
}

/**
 * Simple Floating Action Button
 * Positioned fixed at bottom-right, above BottomNav
 * Hides on scroll down, reappears on scroll up
 */
export default function SimpleFab({ bottom, ...props }: SimpleFabProps) {
  const { visible } = useExtendedFab(50);

  return (
    <Fab
      color="primary"
      size="large"
      {...props}
      sx={{
        position: 'fixed',
        right: 16,
        bottom: bottom || `calc(${BOTTOM_NAV_HEIGHT}px + 16px + env(safe-area-inset-bottom))`,
        zIndex: 1050,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.8)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    />
  );
}
