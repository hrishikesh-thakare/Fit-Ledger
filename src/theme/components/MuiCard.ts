import { Components, Theme } from '@mui/material/styles'

const MuiCard: Components<Theme>['MuiCard'] = {
  defaultProps: {
    elevation: 0,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainer || theme.palette.background.paper,
      borderRadius: '12px',
      border: `1px solid ${theme.palette.divider}`,
      transition: theme.transitions.create(['box-shadow', 'transform', 'background-color'], {
        duration: theme.transitions.duration.shorter,
        easing: theme.transitions.easing.easeOut,
      }),
      '&:hover': {
        boxShadow: theme.shadows[2],
      },
    }),
  },
}

export default MuiCard
