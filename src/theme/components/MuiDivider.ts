import { Components, Theme } from '@mui/material/styles';

const MuiDivider: Components<Theme>['MuiDivider'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderColor: theme.palette.divider,
    }),
  },
};

export default MuiDivider;
