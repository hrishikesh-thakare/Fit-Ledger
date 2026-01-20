import { Components, Theme } from '@mui/material/styles';

const MuiBottomNavigationAction: Components<Theme>['MuiBottomNavigationAction'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      color: theme.palette.text.disabled,
      minWidth: '64px',
      padding: '12px 12px 16px',
      transition: theme.transitions.create(
        ['color', 'background-color'],
        {
          duration: theme.transitions.duration.shorter,
          easing: theme.transitions.easing.easeInOut,
        }
      ),
      '&.Mui-selected': {
        color: theme.palette.primary.main,
        backgroundColor: 'transparent',
      },
      '&:hover': {
        backgroundColor: 'rgba(230, 225, 229, 0.08)',
      },
    }),
    label: ({ theme }) => ({
      fontSize: '0.75rem',
      fontWeight: 500,
      letterSpacing: '0.5px',
      marginTop: '4px',
      '&.Mui-selected': {
        fontSize: '0.75rem',
      },
    }),
  },
};

export default MuiBottomNavigationAction;
