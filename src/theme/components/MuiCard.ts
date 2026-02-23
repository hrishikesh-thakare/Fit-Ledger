import { Components, Theme } from '@mui/material/styles'

const MuiCard: Components<Theme>['MuiCard'] = {
  defaultProps: {
    elevation: 1,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainer || theme.palette.background.paper,
      borderRadius: `${theme.shape.borderRadiusMedium}px`,
      border: `1px solid ${theme.palette.divider}`,
      transition: theme.transitions.create(['box-shadow', 'transform', 'background-color'], {
        duration: 300,
        easing: theme.transitions.easing.easeOut,
      }),
      // Subtle hover for desktop only
      '@media (hover: hover)': {
        '&:hover': {
          boxShadow: theme.shadows[2],
        },
      },
      '&:active': {
        boxShadow: theme.shadows[1],
        transform: 'scale(0.98)',
      },
    }),
  },
}

export default MuiCard
