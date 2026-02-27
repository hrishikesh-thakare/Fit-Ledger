import { Components, Theme } from '@mui/material/styles';

/**
 * Material Design Paper with elevation system
 */
const MuiPaper: Components<Theme>['MuiPaper'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundImage: 'none', // Remove gradient overlay
      transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }),

    rounded: ({ theme }) => ({
      borderRadius: `${theme.shape.borderRadiusSmall}px`,
    }),

    elevation0: ({ theme }) => ({
      backgroundColor: theme.palette.background.paper,
      boxShadow: 'none',
    }),

    elevation1: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainerLow || theme.palette.background.paper,
      boxShadow: theme.shadows[1],
    }),

    elevation2: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainer || theme.palette.background.paper,
      boxShadow: theme.shadows[2],
    }),

    elevation3: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainerHigh || theme.palette.background.paper,
      boxShadow: theme.shadows[3],
    }),
  },
};

export default MuiPaper;
