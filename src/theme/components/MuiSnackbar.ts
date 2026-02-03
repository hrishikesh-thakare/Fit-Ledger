import { Components, Theme } from '@mui/material/styles';

const MuiSnackbar: Components<Theme>['MuiSnackbar'] = {
  styleOverrides: {
    root: {
      // Position above BottomNav
      bottom: 'calc(72px + 32px + env(safe-area-inset-bottom)) !important',
      left: '16px !important',
      right: '16px !important',
    },
    anchorOriginBottomLeft: {
      bottom: 'calc(72px + 32px + env(safe-area-inset-bottom)) !important',
      left: '16px !important',
      right: '16px !important',
    },
  },
};

export default MuiSnackbar;
