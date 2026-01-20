import { Components, Theme } from '@mui/material/styles';

const MuiAppBar: Components<Theme>['MuiAppBar'] = {
  defaultProps: {
    elevation: 0,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: (theme.palette as any).surfaceContainerLow || theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
    }),
    colorPrimary: ({ theme }) => ({
      backgroundColor: (theme.palette as any).surfaceContainerLow || theme.palette.background.paper,
      color: theme.palette.text.primary,
    }),
  },
};

export default MuiAppBar;
