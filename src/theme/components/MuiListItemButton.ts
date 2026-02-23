import { alpha, Components, Theme } from '@mui/material/styles';

const MuiListItemButton: Components<Theme>['MuiListItemButton'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      minHeight: '56px',
      borderRadius: `${theme.shape.borderRadiusSmall}px`,
      transition: theme.transitions.create(
        ['background-color'],
        {
          duration: theme.transitions.duration.shortest,
          easing: theme.transitions.easing.easeInOut,
        }
      ),
      '&:hover': {
        backgroundColor: alpha(theme.palette.text.primary, 0.08),
      },
      '&:active': {
        backgroundColor: alpha(theme.palette.text.primary, 0.12),
      },
      '&.Mui-selected': {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.16),
        },
      },
    }),
  },
};

export default MuiListItemButton;
