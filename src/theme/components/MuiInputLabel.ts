import { Components, Theme } from '@mui/material/styles';

const MuiInputLabel: Components<Theme>['MuiInputLabel'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      color: theme.palette.text.secondary,
      fontSize: '1rem',
      '&.Mui-focused': {
        color: theme.palette.primary.main,
      },
      '&.Mui-error': {
        color: theme.palette.error.main,
      },
    }),
  },
};

export default MuiInputLabel;
