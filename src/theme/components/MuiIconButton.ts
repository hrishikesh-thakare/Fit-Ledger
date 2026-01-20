import { Components, Theme } from '@mui/material/styles';

const MuiIconButton: Components<Theme>['MuiIconButton'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: '12px',
      padding: '12px',
      transition: theme.transitions.create(
        ['background-color', 'color'],
        {
          duration: theme.transitions.duration.shortest,
          easing: theme.transitions.easing.easeInOut,
        }
      ),
      '&:hover': {
        backgroundColor: 'rgba(230, 225, 229, 0.08)',
      },
      '&:active': {
        backgroundColor: 'rgba(230, 225, 229, 0.12)',
      },
    }),
    sizeLarge: {
      padding: '16px',
      fontSize: '1.75rem',
    },
    sizeMedium: {
      padding: '12px',
      fontSize: '1.5rem',
    },
    sizeSmall: {
      padding: '8px',
      fontSize: '1.25rem',
    },
  },
};

export default MuiIconButton;
