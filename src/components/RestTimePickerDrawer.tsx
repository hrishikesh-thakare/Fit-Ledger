'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Box, Typography, Button, SwipeableDrawer, IconButton } from '@mui/material'
import { Close } from '@mui/icons-material'
import DrawerHandle from './ui/DrawerHandle'

interface RestTimePickerDrawerProps {
  open: boolean
  onClose: () => void
  onSave: (seconds: number) => void
  initialValue?: number
}

// Options for minutes (0-15) and seconds (0-59 by 5s or just 0-59)
// Let's use 0-59 for seconds for precision, similar to standard timers.
const minutesOptions = Array.from({ length: 16 }, (_, i) => i) // 0 to 15
const secondsOptions = Array.from({ length: 60 }, (_, i) => i) // 0 to 59

interface PickerItemProps {
  value: number
  isActive: boolean
  onClick: (value: number) => void
  align?: 'left' | 'right' | 'center'
}

const PickerItem = React.memo<PickerItemProps>(({ value, isActive, onClick, align = 'center' }) => {
  return (
    <Box
      onClick={() => onClick(value)}
      sx={{
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'center',
        scrollSnapAlign: 'center',
        cursor: 'pointer',
        opacity: isActive ? 1 : 0.4,
        transition: 'all 0.2s',
      }}
    >
      <Typography
        variant={isActive ? 'h4' : 'h6'}
        fontWeight="bold"
        color={isActive ? 'primary.main' : 'text.disabled'}
      >
        {value.toString().padStart(2, '0')}
      </Typography>
    </Box>
  )
})
PickerItem.displayName = 'PickerItem'

const RestTimePickerDrawer: React.FC<RestTimePickerDrawerProps> = ({
  open,
  onClose,
  onSave,
  initialValue = 60,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(Math.floor(initialValue / 60))
  const [selectedSeconds, setSelectedSeconds] = useState(initialValue % 60)

  const minScrollRef = useRef<HTMLDivElement>(null)
  const secScrollRef = useRef<HTMLDivElement>(null)

  // Initialization scroll loop, identical to WeightPicker robustness fix
  useEffect(() => {
    if (open) {
      const initMin = Math.floor(initialValue / 60)
      const initSec = initialValue % 60

      // Cap initial minutes at 15
      const safeInitMin = Math.min(initMin, 15)

      setSelectedMinutes(safeInitMin)
      setSelectedSeconds(initSec)

      let retries = 0
      const maxRetries = 20

      const scrollToInitial = () => {
        if (
          minScrollRef.current &&
          secScrollRef.current &&
          minScrollRef.current.clientHeight > 0
        ) {
          const minIndex = minutesOptions.indexOf(safeInitMin)
          const secIndex = secondsOptions.indexOf(initSec)

          if (minIndex !== -1) {
            minScrollRef.current.scrollTop = minIndex * 50
          }
          if (secIndex !== -1) {
            secScrollRef.current.scrollTop = secIndex * 50
          }
        } else if (retries < maxRetries) {
          retries++
          requestAnimationFrame(scrollToInitial)
        }
      }

      requestAnimationFrame(scrollToInitial)
    }
  }, [open, initialValue])

  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>,
    items: number[],
    currentValue: number,
    setState: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    const container = e.currentTarget
    const index = Math.round(container.scrollTop / 50)

    if (index >= 0 && index < items.length) {
      const newValue = items[index]
      if (newValue !== currentValue) {
        setState(newValue)
      }
    }
  }

  const handleSave = () => {
    onSave(selectedMinutes * 60 + selectedSeconds)
    onClose()
  }

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => { }}
      disableSwipeToOpen={true}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        },
      }}
    >
      <DrawerHandle />

      <Box sx={{ px: 2, pb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            px: 1,
          }}
        >
          <Typography variant="h6" fontWeight="700">
            Set Rest Time
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Dual Carousels */}
        <Box
          sx={{
            height: 200,
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 1.5,
            mb: 3,
          }}
        >
          {/* Minutes Column */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              textAlign: 'right',
              pr: 2,
            }}
            ref={minScrollRef}
            onScroll={(e) => handleScroll(e, minutesOptions, selectedMinutes, setSelectedMinutes)}
          >
            <Box sx={{ height: 75, flexShrink: 0 }} />
            {minutesOptions.map((val) => (
              <PickerItem
                key={val}
                value={val}
                isActive={val === selectedMinutes}
                onClick={setSelectedMinutes}
                align="right"
              />
            ))}
            <Box sx={{ height: 75, flexShrink: 0 }} />
          </Box>

          {/* Separator / Colon */}
          <Box sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              :
            </Typography>
          </Box>

          {/* Seconds Column */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              textAlign: 'left',
              pl: 2,
            }}
            ref={secScrollRef}
            onScroll={(e) => handleScroll(e, secondsOptions, selectedSeconds, setSelectedSeconds)}
          >
            <Box sx={{ height: 75, flexShrink: 0 }} />
            {secondsOptions.map((val) => (
              <PickerItem
                key={val}
                value={val}
                isActive={val === selectedSeconds}
                onClick={setSelectedSeconds}
                align="left"
              />
            ))}
            <Box sx={{ height: 75, flexShrink: 0 }} />
          </Box>

          {/* Selection Indicator Line */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 16,
              right: 16,
              height: 50,
              marginTop: '-25px',
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'primary.main',
              pointerEvents: 'none',
              opacity: 0.1,
            }}
          />

          {/* Stationary Labels */}
          <Typography
            variant="body1"
            fontWeight="bold"
            color="text.secondary"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '15%',
              marginTop: '-12px',
              pointerEvents: 'none',
            }}
          >
            min
          </Typography>
          <Typography
            variant="body1"
            fontWeight="bold"
            color="text.secondary"
            sx={{
              position: 'absolute',
              top: '50%',
              right: '15%',
              marginTop: '-12px',
              pointerEvents: 'none',
            }}
          >
            sec
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSave}
          sx={{
            py: 1.5,
            fontWeight: 700,
            borderRadius: 1.5,
          }}
        >
          Done
        </Button>
      </Box>
    </SwipeableDrawer>
  )
}

export default RestTimePickerDrawer
