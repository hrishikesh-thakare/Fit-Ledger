'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { AppBar, AppBarProps } from '@mui/material';

interface AppBarWithScrollProps extends AppBarProps {
  children: ReactNode;
  elevationTrigger?: number;
}

/**
 * Material Design App Bar with scroll elevation
 * Adds elevation when scrolling past a threshold
 */
export default function AppBarWithScroll({
  children,
  elevationTrigger = 0,
  ...props
}: AppBarWithScrollProps) {
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const shouldElevate = window.scrollY > elevationTrigger;
      if (shouldElevate !== elevated) {
        setElevated(shouldElevate);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [elevationTrigger, elevated]);

  return (
    <AppBar
      {...props}
      elevation={elevated ? 2 : 0}
      sx={{
        transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...props.sx,
      }}
    >
      {children}
    </AppBar>
  );
}
