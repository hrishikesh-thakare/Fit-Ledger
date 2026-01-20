import { Components, Theme } from '@mui/material/styles';

const MuiFab: Components<Theme>['MuiFab'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      boxShadow: `0 6px 12px rgba(103, 80, 164, 0.3)`,
      transition: theme.transitions.create(
        ['box-shadow', 'transform', 'background-color'],
        {
          duration: theme.transitions.duration.shorter,
          easing: theme.transitions.easing.easeInOut,
        }
      ),
      '&:hover': {
        boxShadow: `0 8px 16px rgba(103, 80, 164, 0.4)`,
        transform: 'scale(1.05)',
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
