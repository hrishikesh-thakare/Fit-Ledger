import { Components, Theme } from '@mui/material/styles'

const MuiChip: Components<Theme>['MuiChip'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: '8px',
      height: '32px',
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.1px',
      transition: theme.transitions.create(['background-color', 'box-shadow', 'transform'], {
        duration: 200,
        easing: theme.transitions.easing.easeInOut,
      }),
    }),
    filled: ({ theme }) => ({
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    }),
    outlined: ({ theme }) => ({
      borderColor: theme.palette.outline,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'rgba(208, 188, 255, 0.08)',
      },
    }),
    clickable: ({ theme }) => ({
      '&:hover': {
        transform: 'translateY(-1px)',
      },
      '&:active': {
        boxShadow: 'none',
        transform: 'translateY(0)',
      },
    }),
    icon: ({ theme }) => ({
      color: 'inherit',
      marginLeft: 8,
    }),
    deleteIcon: ({ theme }) => ({
      color: 'inherit',
      '&:hover': {
        color: 'inherit',
        opacity: 0.8,
      },
    }),
  },
}

export default MuiChip
