import { Components, Theme } from '@mui/material/styles';

const MuiToolbar: Components<Theme>['MuiToolbar'] = {
  styleOverrides: {
    root: {
      minHeight: '64px',
      '@media (min-width: 600px)': {
        minHeight: '64px',
      },
    },
  },
};

export default MuiToolbar;
