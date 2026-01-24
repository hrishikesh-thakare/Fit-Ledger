'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'

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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle component="div" sx={{ textAlign: 'center', pb: 0 }}>
        <Typography component="div" variant="h6" fontWeight="bold">
          Filter History
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 1, px: 2 }}>
        <Box
          sx={{
            height: 200,
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            mt: 2,
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
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="text" size="large" sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          size="large"
          sx={{ px: 4, borderRadius: 2 }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default HistoryDatePicker
