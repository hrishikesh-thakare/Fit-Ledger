'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SharedAxisTransitionProps {
  children: ReactNode;
  direction?: 'x' | 'y' | 'z';
  distance?: number;
}

/**
 * Material Design Shared Axis Transition
 * Used for page transitions in Android apps
 * 
 * - X-axis: Horizontal navigation (left/right)
 * - Y-axis: Vertical navigation (up/down)
 * - Z-axis: Depth navigation (forward/back with scale)
 */
export default function SharedAxisTransition({
  children,
  direction = 'y',
  distance = 30,
}: SharedAxisTransitionProps) {
  const getVariants = () => {
    switch (direction) {
      case 'x':
        return {
          initial: { opacity: 0, x: distance },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -distance },
        };
      case 'y':
        return {
          initial: { opacity: 0, y: distance },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -distance },
        };
      case 'z':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.05 },
        };
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={getVariants()}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Material standard easing
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
