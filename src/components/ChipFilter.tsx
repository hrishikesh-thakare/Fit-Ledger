'use client';

import React from 'react';
import { Box, Chip } from '@mui/material';
import { Check } from '@mui/icons-material';

interface ChipFilterProps {
  options: string[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  label?: string;
}

/**
 * Material Design Chip Filter component
 * Supports both single and multi-select modes
 */
export default function ChipFilter({
  options,
  selected,
  onChange,
  multiSelect = false,
  label,
}: ChipFilterProps) {
  const isSelected = (option: string) => {
    if (Array.isArray(selected)) {
      return selected.includes(option);
    }
    return selected === option;
  };

  const handleClick = (option: string) => {
    if (multiSelect && Array.isArray(selected)) {
      if (selected.includes(option)) {
        onChange(selected.filter((item) => item !== option));
      } else {
        onChange([...selected, option]);
      }
    } else {
      onChange(option);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {label && (
        <Box
          component="label"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'text.secondary',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            ml: 0.5,
          }}
        >
          {label}
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {options.map((option) => {
          const selected = isSelected(option);
          return (
            <Chip
              key={option}
              label={option}
              color="primary"
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => handleClick(option)}
              icon={selected && multiSelect ? <Check /> : undefined}
              sx={{
                height: 36,
                fontWeight: selected ? 600 : 400,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
