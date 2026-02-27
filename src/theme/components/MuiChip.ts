import { alpha, Components, Theme } from '@mui/material/styles'

const MuiChip: Components<Theme>['MuiChip'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: `${theme.shape.borderRadiusExtraSmall}px`,
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
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      },
    }),
    clickable: () => ({
      '&:active': {
        boxShadow: 'none',
        transform: 'scale(0.98)',
      },
    }),
    icon: () => ({
      color: 'inherit',
      marginLeft: 8,
    }),
    deleteIcon: () => ({
      color: 'inherit',
      '&:hover': {
        color: 'inherit',
        opacity: 0.8,
      },
    }),
  },
}

export default MuiChip
