'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { BottomNavigation, BottomNavigationAction, Box } from '@mui/material'
import { Dashboard, FitnessCenter, History, Person, MonitorWeight } from '@mui/icons-material'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const getActiveIndex = React.useCallback(() => {
    if (pathname === '/dashboard') return 0
    if (pathname === '/routines') return 1
    if (pathname.startsWith('/history')) return 2
    if (pathname === '/profile/bodyweight') return 3
    if (pathname === '/profile') return 4
    return 0
  }, [pathname])

  const [value, setValue] = React.useState(getActiveIndex())

  React.useEffect(() => {
    setValue(getActiveIndex())
  }, [pathname, getActiveIndex])

  const handleNavChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
    const routes = ['/dashboard', '/routines', '/history', '/profile/bodyweight', '/profile']
    router.push(routes[newValue])
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 1000,
      }}
    >
      <BottomNavigation
        value={value}
        onChange={handleNavChange}
        showLabels
        sx={{
          height: 72,
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            minWidth: 'auto',
            padding: '6px 0',
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            '&.Mui-selected': {
              fontSize: '0.75rem',
            },
          },
        }}
      >
        <BottomNavigationAction label="Dashboard" icon={<Dashboard />} />
        <BottomNavigationAction label="Routines" icon={<FitnessCenter />} />
        <BottomNavigationAction label="History" icon={<History />} />
        <BottomNavigationAction label="Weight" icon={<MonitorWeight />} />
        <BottomNavigationAction label="Profile" icon={<Person />} />
      </BottomNavigation>
    </Box>
  )
}
