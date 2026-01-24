import { Components, Theme } from '@mui/material/styles'

const MuiChip: Components<Theme>['MuiChip'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: '8px',
      height: '32px',
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.1px',
      transition: theme.transitions.create(['background-color', 'box-shadow'], {
        duration: theme.transitions.duration.shortest,
        easing: theme.transitions.easing.easeInOut,
      }),
    }),
    filled: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainerLow || theme.palette.background.paper,
      border: `1px solid ${theme.palette.outline}`,
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: 'rgba(230, 225, 229, 0.08)',
      },
    }),
    outlined: ({ theme }) => ({
      borderColor: theme.palette.outline,
      '&:hover': {
        backgroundColor: 'rgba(230, 225, 229, 0.08)',
      },
    }),
    clickable: {
      '&:active': {
        boxShadow: 'none',
      },
    },
  },
}

export default MuiChip
