import { Components, Theme } from '@mui/material/styles';

const MuiSpeedDial: Components<Theme>['MuiSpeedDial'] = {
  styleOverrides: {
    fab: ({ theme }) => ({
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: theme.shadows[6],
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        boxShadow: theme.shadows[8],
      },
      '&:active': {
        boxShadow: theme.shadows[6],
      },
    }),
    actions: {
      paddingBottom: 8,
    },
  },
};

export default MuiSpeedDial;
