'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StaggerListProps {
  children: ReactNode[];
  staggerDelay?: number;
}

/**
 * Material Design Stagger Animation for Lists
 * Items appear sequentially with a slight delay
 */
export default function StaggerList({ children, staggerDelay = 0.05 }: StaggerListProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: index * staggerDelay,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}
