import { Components, Theme } from '@mui/material/styles';

const MuiListItemButton: Components<Theme>['MuiListItemButton'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      minHeight: '56px',
      borderRadius: '12px',
      transition: theme.transitions.create(
        ['background-color'],
        {
          duration: theme.transitions.duration.shortest,
          easing: theme.transitions.easing.easeInOut,
        }
      ),
      '&:hover': {
        backgroundColor: 'rgba(230, 225, 229, 0.08)',
      },
      '&:active': {
        backgroundColor: 'rgba(230, 225, 229, 0.12)',
      },
      '&.Mui-selected': {
        backgroundColor: 'rgba(208, 188, 255, 0.12)',
        '&:hover': {
          backgroundColor: 'rgba(208, 188, 255, 0.16)',
        },
      },
    }),
  },
};

export default MuiListItemButton;
