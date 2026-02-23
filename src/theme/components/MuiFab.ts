import { alpha, Components, Theme } from '@mui/material/styles';

const MuiFab: Components<Theme>['MuiFab'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      boxShadow: `0 6px 12px ${alpha(theme.palette.primary.dark, 0.3)}`,
      transition: theme.transitions.create(
        ['box-shadow', 'transform', 'background-color'],
        {
          duration: theme.transitions.duration.shorter,
          easing: theme.transitions.easing.easeInOut,
        }
      ),
      '&:hover': {
        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.dark, 0.4)}`,
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
    }),
    sizeMedium: {
      width: '56px',
      height: '56px',
    },
    sizeSmall: {
      width: '40px',
      height: '40px',
    },
    primary: ({ theme }) => ({
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    }),
  },
};

export default MuiFab;
