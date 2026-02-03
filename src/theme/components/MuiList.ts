import { Components, Theme } from '@mui/material/styles';

/**
 * Material Design List styling
 */
const MuiList: Components<Theme>['MuiList'] = {
  styleOverrides: {
    root: {
      padding: 0,
    },
  },
};

export default MuiList;
