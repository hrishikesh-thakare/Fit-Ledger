import { Components, Theme } from '@mui/material/styles';

/**
 * Material Design Bottom Sheet styling
 * Using 28px corner radius for MD3
 */
const MuiDrawer: Components<Theme>['MuiDrawer'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainerLow || theme.palette.background.paper,
      backgroundImage: 'none', // Remove gradient overlay
    }),
    
    // Bottom drawer (sheet)
    paperAnchorBottom: {
      borderTopLeftRadius: '28px',
      borderTopRightRadius: '28px',
      maxHeight: '90vh',
    },
    
    // Top drawer
    paperAnchorTop: {
      borderBottomLeftRadius: '28px',
      borderBottomRightRadius: '28px',
    },
    
    // Right drawer
    paperAnchorRight: {
      borderTopLeftRadius: '28px',
      borderBottomLeftRadius: '28px',
    },
    
    // Left drawer
    paperAnchorLeft: {
      borderTopRightRadius: '28px',
      borderBottomRightRadius: '28px',
    },
  },
};

export default MuiDrawer;
