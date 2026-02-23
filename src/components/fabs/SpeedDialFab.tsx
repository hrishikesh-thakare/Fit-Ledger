'use client';

import React from 'react';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { Add } from '@mui/icons-material';
import { BOTTOM_NAV_HEIGHT } from '@/components/layout/constants';

export interface SpeedDialActionItem {
  icon: React.ReactNode;
  name: string;
  onClick: () => void;
}

interface SpeedDialFabProps {
  actions: SpeedDialActionItem[];
  mainIcon?: React.ReactNode;
  bottom?: number | string;
}

/**
 * Speed Dial FAB - Opens to reveal multiple quick actions
 * Perfect for pages with multiple primary actions (e.g., Dashboard)
 */
export default function SpeedDialFab({ actions, mainIcon, bottom }: SpeedDialFabProps) {
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAction = (action: SpeedDialActionItem) => {
    action.onClick();
    handleClose();
  };

  return (
    <SpeedDial
      ariaLabel="Quick actions"
      icon={mainIcon || <SpeedDialIcon icon={<Add />} />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
      direction="up"
      sx={{
        position: 'fixed',
        right: 16,
        bottom: bottom || `calc(${BOTTOM_NAV_HEIGHT}px + 16px + env(safe-area-inset-bottom))`,
        zIndex: 1050,
        '& .MuiSpeedDial-fab': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        },
      }}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => handleAction(action)}
          tooltipOpen
          sx={{
            '& .MuiSpeedDialAction-staticTooltipLabel': {
              whiteSpace: 'nowrap',
              bgcolor: 'surfaceContainerHigh',
              color: 'text.primary',
              px: 2,
              py: 1,
              borderRadius: 2,
              fontSize: '0.875rem',
              fontWeight: 500,
            },
          }}
        />
      ))}
    </SpeedDial>
  );
}
