import { Components, Theme } from '@mui/material/styles';

const MuiSpeedDialAction: Components<Theme>['MuiSpeedDialAction'] = {
  styleOverrides: {
    fab: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainerHigh,
      color: theme.palette.text.primary,
      boxShadow: theme.shadows[3],
      '&:hover': {
        backgroundColor: theme.palette.surfaceContainerHighest,
      },
    }),
    staticTooltipLabel: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainerHigh,
      color: theme.palette.text.primary,
      padding: '8px 16px',
      borderRadius: 8,
      fontSize: '0.875rem',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      boxShadow: theme.shadows[2],
    }),
  },
};

export default MuiSpeedDialAction;
