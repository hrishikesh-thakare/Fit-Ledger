import { Components, Theme } from '@mui/material/styles';

const MuiButton: Components<Theme>['MuiButton'] = {
  defaultProps: {
    disableElevation: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: '20px', // Full rounded for MD3
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.1px',
      minHeight: '40px',
      padding: '10px 24px',
      transition: theme.transitions.create(
        ['background-color', 'box-shadow', 'transform'],
        {
          duration: theme.transitions.duration.short,
          easing: theme.transitions.easing.easeInOut,
        }
      ),
      '&:active': {
        transform: 'scale(0.98)',
      },
    }),
    sizeLarge: {
      minHeight: '48px',
      padding: '12px 28px',
      fontSize: '0.9375rem',
    },
    sizeMedium: {
      minHeight: '40px',
      padding: '10px 24px',
      fontSize: '0.875rem',
    },
    sizeSmall: {
      minHeight: '32px',
      padding: '8px 20px',
      fontSize: '0.8125rem',
    },
    contained: ({ theme }) => ({
      boxShadow: 'none',
      '&:hover': {
        boxShadow: 'none',
        backgroundColor: theme.palette.primary.dark,
      },
      '&:active': {
        boxShadow: 'none',
      },
    }),
    outlined: ({ theme }) => ({
      borderWidth: '1px',
      borderColor: theme.palette.outline,
      '&:hover': {
        borderWidth: '1px',
        backgroundColor: 'rgba(208, 188, 255, 0.08)',
      },
    }),
    text: {
      '&:hover': {
        backgroundColor: 'rgba(230, 225, 229, 0.08)',
      },
    },
  },
};

export default MuiButton;
