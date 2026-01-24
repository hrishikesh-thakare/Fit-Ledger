import { Components, Theme } from '@mui/material/styles'

const MuiBottomNavigation: Components<Theme>['MuiBottomNavigation'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainerLow || theme.palette.background.paper,
      borderTop: `1px solid ${theme.palette.divider}`,
      height: '80px',
      boxShadow: theme.shadows[3],
    }),
  },
}

export default MuiBottomNavigation
