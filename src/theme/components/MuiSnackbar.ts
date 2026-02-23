import { Components, Theme } from '@mui/material/styles';
import { BOTTOM_NAV_HEIGHT } from '@/components/layout/constants';

const MuiSnackbar: Components<Theme>['MuiSnackbar'] = {
  styleOverrides: {
    root: {
      // Position above BottomNav
      bottom: `calc(${BOTTOM_NAV_HEIGHT}px + 32px + env(safe-area-inset-bottom)) !important`,
      left: '16px !important',
      right: '16px !important',
    },
    anchorOriginBottomLeft: {
      bottom: `calc(${BOTTOM_NAV_HEIGHT}px + 32px + env(safe-area-inset-bottom)) !important`,
      left: '16px !important',
      right: '16px !important',
    },
  },
};

export default MuiSnackbar;
