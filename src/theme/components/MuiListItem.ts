import { Components, Theme } from '@mui/material/styles';

const MuiListItem: Components<Theme>['MuiListItem'] = {
  styleOverrides: {
    root: {
      paddingTop: '12px',
      paddingBottom: '12px',
      minHeight: '56px',
    },
  },
};

export default MuiListItem;
