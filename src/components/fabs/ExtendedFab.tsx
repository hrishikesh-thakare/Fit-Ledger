'use client';

import React from 'react';
import { Fab, Box } from '@mui/material';
import { useExtendedFab } from '@/hooks/useExtendedFab';
import { BOTTOM_NAV_HEIGHT } from '@/components/layout/constants';

interface ExtendedFabProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'default';
  bottom?: number | string;
}

/**
 * Extended Floating Action Button with scroll behavior
 * - Shows full label at top of page
 * - Collapses to icon-only on scroll down
 * - Hides when scrolling down fast, shows on scroll up
 */
export default function ExtendedFab({
  icon,
  label,
  onClick,
  color = 'primary',
  bottom,
}: ExtendedFabProps) {
  const { extended, visible } = useExtendedFab(50);

  return (
    <Fab
      variant={extended ? 'extended' : 'circular'}
      color={color}
      onClick={onClick}
      size="large"
      sx={{
        position: 'fixed',
        right: 16,
        bottom: bottom || `calc(${BOTTOM_NAV_HEIGHT}px + 16px + env(safe-area-inset-bottom))`,
        zIndex: 1050,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.8)',
        pointerEvents: visible ? 'auto' : 'none',
        minWidth: extended ? 'auto' : 56,
        px: extended ? 3 : 0,
      }}
    >
      {icon}
      {extended && (
        <Box
          sx={{
            ml: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Box>
      )}
    </Fab>
  );
}
