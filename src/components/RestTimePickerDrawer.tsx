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

// Seconds from 5 to 300 in steps of 5
const secondsOptions = Array.from({ length: 60 }, (_, i) => (i + 1) * 10)

interface PickerItemProps {
  value: number
  isActive: boolean
  onClick: (value: number) => void
}

const PickerItem = React.memo<PickerItemProps>(({ value, isActive, onClick }) => {
  return (
    <Box
      onClick={() => onClick(value)}
      sx={{
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        {value}
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
  const [selectedValue, setSelectedValue] = useState(initialValue)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to initial value when opened
  useEffect(() => {
    if (open && scrollRef.current) {
      // Find closest value in options
      const closest = secondsOptions.reduce((prev, curr) => {
        return Math.abs(curr - initialValue) < Math.abs(prev - initialValue) ? curr : prev
      })

      setSelectedValue(closest)

      const index = secondsOptions.indexOf(closest)
      if (index !== -1) {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = index * 50 - scrollRef.current.clientHeight / 2 + 25
          }
        }, 100)
      }
    }
  }, [open, initialValue])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const index = Math.round((container.scrollTop - container.clientHeight / 2 + 25) / 50)
    // Adjust logic to match WeightPicker's simplified calculation if centered padding is used
    // WeightPicker logic: index = Math.round((container.scrollTop - 5) / 50) (approximated)
    // Let's use clean calculation based on item height 50
    // Center is scrollTop + clientHeight/2
    // Item center at index i is i*50 + 25 + padding

    // Using the same logic style as WeightPicker for consistency and robustness
    const visualCenter = container.scrollTop + container.clientHeight / 2
    // Subtract padding top (which is 40% height ~ 80px maybe? let's assume padding logic holds)
    // Let's rely on simple item index mapping assuming padding aligns the first item

    // Actually, let's stick to the WeightPicker logic exactly
    // scrollTop 0 means first item is at top? No, WeightPicker has huge padding.
    // Box sx={{ height: '40%' }} corresponds to ~80px padding if height is 200px.

    // Simplified logic:
    const itemHeight = 50
    const padding = 80 // 40% of 200px
    const scrolledTop = container.scrollTop
    const selectedIndex = Math.round(scrolledTop / itemHeight)

    if (selectedIndex >= 0 && selectedIndex < secondsOptions.length) {
      const newValue = secondsOptions[selectedIndex]
      if (newValue !== selectedValue) {
        setSelectedValue(newValue)
      }
    }
  }

  const handleSave = () => {
    onSave(selectedValue)
    onClose()
  }

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
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

        {/* Carousel */}
        <Box
          sx={{
            height: 200,
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              textAlign: 'center',
            }}
            ref={scrollRef}
            onScroll={handleScroll}
          >
            <Box sx={{ height: 75 }} /> {/* Padding to center first item */}
            {secondsOptions.map((val) => (
              <PickerItem
                key={val}
                value={val}
                isActive={val === selectedValue}
                onClick={(v) => {
                  setSelectedValue(v)
                  const idx = secondsOptions.indexOf(v)
                  if (scrollRef.current) {
                    scrollRef.current.scrollTo({ top: idx * 50, behavior: 'smooth' })
                  }
                }}
              />
            ))}
            <Box sx={{ height: 75 }} /> {/* Padding to center last item */}
          </Box>

          {/* Selection Indicator Line */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 32,
              right: 32,
              height: 50,
              marginTop: '-25px',
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'primary.main',
              pointerEvents: 'none',
              opacity: 0.2,
            }}
          />

          <Typography
            variant="h6"
            sx={{
              position: 'absolute',
              top: '50%',
              right: 60,
              transform: 'translateY(-50%)',
              color: 'text.secondary',
              fontWeight: 600,
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
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: 3,
          }}
        >
          Done
        </Button>
      </Box>
    </SwipeableDrawer>
  )
}

export default RestTimePickerDrawer
