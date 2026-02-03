'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FadeThroughProps {
  children: ReactNode;
  duration?: number;
}

/**
 * Material Design Fade Through Transition
 * Used for content swaps and tab changes
 * Elements fade out then fade in with new content
 */
export default function FadeThrough({ children, duration = 0.15 }: FadeThroughProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        ease: [0, 0, 0.2, 1], // Material decelerated easing
      }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
