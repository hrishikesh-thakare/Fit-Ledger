'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Box, Typography, SwipeableDrawer, Button, IconButton } from '@mui/material'
import { Close } from '@mui/icons-material'
import DrawerHandle from './ui/DrawerHandle'

interface HistoryDatePickerProps {
  open: boolean
  onClose: () => void
  onSave: (date: Date) => void
  initialDate?: Date
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
// Years from 2020 to 2030
const years = Array.from({ length: 11 }, (_, i) => 2020 + i)

interface PickerItemProps {
  value: string | number
  isActive: boolean
  onClick: (value: string | number) => void
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
        variant={isActive ? 'h5' : 'h6'}
        fontWeight="bold"
        color={isActive ? 'primary.main' : 'text.disabled'}
      >
        {value}
      </Typography>
    </Box>
  )
})
PickerItem.displayName = 'PickerItem'

const HistoryDatePicker: React.FC<HistoryDatePickerProps> = ({
  open,
  onClose,
  onSave,
  initialDate = new Date(),
}) => {
  const [selectedMonth, setSelectedMonth] = useState(months[initialDate.getMonth()])
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear())

  const monthScrollRef = useRef<HTMLDivElement>(null)
  const yearScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      // Scroll months
      if (monthScrollRef.current) {
        const mIndex = months.indexOf(selectedMonth)
        if (mIndex !== -1) {
          setTimeout(() => {
            if (monthScrollRef.current) {
              monthScrollRef.current.scrollTop =
                mIndex * 50 - monthScrollRef.current.clientHeight / 2 + 25
            }
          }, 100)
        }
      }
      // Scroll years
      if (yearScrollRef.current) {
        const yIndex = years.indexOf(selectedYear)
        if (yIndex !== -1) {
          setTimeout(() => {
            if (yearScrollRef.current) {
              yearScrollRef.current.scrollTop =
                yIndex * 50 - yearScrollRef.current.clientHeight / 2 + 25
            }
          }, 100)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // Re-run when opened

  const handleSave = () => {
    const monthIndex = months.indexOf(selectedMonth)
    const date = new Date(selectedYear, monthIndex, 1)
    onSave(date)
  }

  const handleScroll = <T extends string | number>(
    e: React.UIEvent<HTMLDivElement>,
    items: T[],
    currentValue: T,
    setState: React.Dispatch<React.SetStateAction<T>>,
  ) => {
    const container = e.currentTarget
    const index = Math.round((container.scrollTop - 5) / 50)

    if (index >= 0 && index < items.length) {
      const newValue = items[index]
      if (newValue !== currentValue) {
        setState(newValue)
      }
    }
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
          bgcolor: 'background.paper',
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
            mb: 2,
            px: 1,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Filter History
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Box
          sx={{
            height: 200,
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            mt: 1,
            mb: 3,
          }}
        >
          {/* Month Column */}
          <Box
            sx={{
              flex: 1.5,
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              textAlign: 'right',
              pr: 2,
            }}
            ref={monthScrollRef}
            onScroll={(e) => handleScroll(e, months, selectedMonth, setSelectedMonth)}
          >
            <Box sx={{ height: '40%' }} />
            {months.map((m) => (
              <PickerItem
                key={m}
                value={m}
                isActive={m === selectedMonth}
                onClick={(val) => setSelectedMonth(val as string)}
                align="right"
              />
            ))}
            <Box sx={{ height: '40%' }} />
          </Box>

          {/* Separator (Invisible spacer mainly) */}
          <Box sx={{ width: 10 }} />

          {/* Year Column */}
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
            ref={yearScrollRef}
            onScroll={(e) => handleScroll(e, years, selectedYear, setSelectedYear)}
          >
            <Box sx={{ height: '40%' }} />
            {years.map((y) => (
              <PickerItem
                key={y}
                value={y}
                isActive={y === selectedYear}
                onClick={(val) => setSelectedYear(val as number)}
                align="left"
              />
            ))}
            <Box sx={{ height: '40%' }} />
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
          Apply Filter
        </Button>
      </Box>
    </SwipeableDrawer>
  )
}

export default HistoryDatePicker
