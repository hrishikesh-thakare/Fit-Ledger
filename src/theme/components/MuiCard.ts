import { Components, Theme } from '@mui/material/styles'

const MuiCard: Components<Theme>['MuiCard'] = {
  defaultProps: {
    elevation: 1,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainer || theme.palette.background.paper,
      borderRadius: '12px',
      border: `1px solid ${theme.palette.divider}`,
      transition: theme.transitions.create(['box-shadow', 'transform', 'background-color'], {
        duration: 300,
        easing: theme.transitions.easing.easeOut,
      }),
      // Proper Material elevation states for interactive cards
      '@media (hover: hover)': {
        '&:hover': {
          boxShadow: theme.shadows[2],
          transform: 'translateY(-2px)',
        },
      },
      '&:active': {
        boxShadow: theme.shadows[1],
        transform: 'translateY(0)',
      },
    }),
  },
}

export default MuiCard
