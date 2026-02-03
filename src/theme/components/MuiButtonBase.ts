import { Components, Theme } from '@mui/material/styles';

const MuiButtonBase: Components<Theme>['MuiButtonBase'] = {
  defaultProps: {
    disableRipple: false,
    disableTouchRipple: false,
  },
  styleOverrides: {
    root: {
      // Material ripple configuration
      '& .MuiTouchRipple-root': {
        color: 'rgba(208, 188, 255, 0.12)',
      },
      '& .MuiTouchRipple-rippleVisible': {
        opacity: 0.12,
        animation: 'mui-ripple-enter 600ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '& .MuiTouchRipple-child': {
        backgroundColor: 'currentColor',
      },
    },
  },
};

export default MuiButtonBase;
