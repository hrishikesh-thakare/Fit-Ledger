import { alpha, Components, Theme } from '@mui/material/styles';

const MuiCheckbox: Components<Theme>['MuiCheckbox'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: '12px',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      },
      '&.Mui-checked': {
        color: theme.palette.primary.main,
      },
    }),
  },
};

export default MuiCheckbox;
