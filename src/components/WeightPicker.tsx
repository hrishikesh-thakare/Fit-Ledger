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
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'

interface WeightPickerProps {
  open: boolean
  onClose: () => void
  onSave: (weight: number, date: Date) => void
  initialWeight?: number
}

// Weights from 20 to 300
const integers = Array.from({ length: 281 }, (_, i) => 20 + i)
const decimals = Array.from({ length: 10 }, (_, i) => i)

interface PickerItemProps {
  value: number
  isActive: boolean
  onClick: (value: number) => void
  align?: 'left' | 'right'
}

const PickerItem = React.memo<PickerItemProps>(({ value, isActive, onClick, align = 'right' }) => {
  return (
    <Box
      onClick={() => onClick(value)}
      sx={{
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
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

const WeightPicker: React.FC<WeightPickerProps> = ({
  open,
  onClose,
  onSave,
  initialWeight = 75.0,
}) => {
  const [integerPart, setIntegerPart] = useState(Math.floor(initialWeight))
  const [decimalPart, setDecimalPart] = useState(Math.round((initialWeight % 1) * 10))
  // Use dayjs state for the picker, initialize to today
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs())

  const integerScrollRef = useRef<HTMLDivElement>(null)
  const decimalScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      // Scroll integers
      if (integerScrollRef.current) {
        const intIndex = integers.indexOf(integerPart)
        if (intIndex !== -1) {
          setTimeout(() => {
            if (integerScrollRef.current) {
              integerScrollRef.current.scrollTop =
                intIndex * 50 - integerScrollRef.current.clientHeight / 2 + 25
            }
          }, 100)
        }
      }
      // Scroll decimals
      if (decimalScrollRef.current) {
        const decIndex = decimals.indexOf(decimalPart)
        if (decIndex !== -1) {
          setTimeout(() => {
            if (decimalScrollRef.current) {
              decimalScrollRef.current.scrollTop =
                decIndex * 50 - decimalScrollRef.current.clientHeight / 2 + 25
            }
          }, 100)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = () => {
    // Must have a date to save, default to today if null for robustness
    const dateToSave = selectedDate ? selectedDate.toDate() : new Date()
    onSave(integerPart + decimalPart / 10, dateToSave)
  }

  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>,
    items: number[],
    currentValue: number,
    setState: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    const container = e.currentTarget
    // Item height is 50px.
    // Index calculation based on visual center alignment
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
          overflow: 'visible', // Allow picker popper to overflow if needed, though usually it's a portal
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Typography variant="h6" fontWeight="bold">
          Log Weight
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 1, px: 2, overflow: 'visible' }}>
        {/* MUI Date Picker */}
        <Box sx={{ mt: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              format="DD/MM/YYYY"
              closeOnSelect
              slotProps={{ actionBar: { actions: [] } }}
              sx={{ width: '100%' }}
            />
          </LocalizationProvider>
        </Box>

        {/* Weight Carousels */}
        <Box
          sx={{
            height: 200,
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            // bgcolor: 'surfaceContainer', // Removed as per request
            borderRadius: 2,
          }}
        >
          {/* Integer Column */}
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
            ref={integerScrollRef}
            onScroll={(e) => handleScroll(e, integers, integerPart, setIntegerPart)}
          >
            <Box sx={{ height: '40%' }} />
            {integers.map((val) => (
              <PickerItem
                key={val}
                value={val}
                isActive={val === integerPart}
                onClick={setIntegerPart}
                align="right"
              />
            ))}
            <Box sx={{ height: '40%' }} />
          </Box>

          {/* Separator */}
          <Box sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              .
            </Typography>
          </Box>

          {/* Decimal Column */}
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
            ref={decimalScrollRef}
            onScroll={(e) => handleScroll(e, decimals, decimalPart, setDecimalPart)}
          >
            <Box sx={{ height: '40%' }} />
            {decimals.map((val) => (
              <PickerItem
                key={val}
                value={val}
                isActive={val === decimalPart}
                onClick={setDecimalPart}
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

          {/* Stationary 'kg' label */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: 32,
              marginTop: '-14px',
              pointerEvents: 'none',
            }}
          >
            <Typography variant="body1" fontWeight="bold" color="text.secondary">
              kg
            </Typography>
          </Box>
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
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WeightPicker
