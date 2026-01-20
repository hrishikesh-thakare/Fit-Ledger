import { Components, Theme } from '@mui/material/styles';

const MuiCardContent: Components<Theme>['MuiCardContent'] = {
  styleOverrides: {
    root: {
      padding: '16px',
      '&:last-child': {
        paddingBottom: '16px',
      },
    },
  },
};

export default MuiCardContent;
