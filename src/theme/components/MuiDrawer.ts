import { Components, Theme } from '@mui/material/styles';

/**
 * Material Design Bottom Sheet styling
 * Using shape.borderRadiusLarge for MD3
 */
const MuiDrawer: Components<Theme>['MuiDrawer'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainerLow || theme.palette.background.paper,
      backgroundImage: 'none', // Remove gradient overlay
    }),
    
    // Bottom drawer (sheet)
    paperAnchorBottom: ({ theme }) => ({
      borderTopLeftRadius: `${theme.shape.borderRadiusLarge}px`,
      borderTopRightRadius: `${theme.shape.borderRadiusLarge}px`,
      maxHeight: '90vh',
    }),
    
    // Top drawer
    paperAnchorTop: ({ theme }) => ({
      borderBottomLeftRadius: `${theme.shape.borderRadiusLarge}px`,
      borderBottomRightRadius: `${theme.shape.borderRadiusLarge}px`,
    }),
    
    // Right drawer
    paperAnchorRight: ({ theme }) => ({
      borderTopLeftRadius: `${theme.shape.borderRadiusLarge}px`,
      borderBottomLeftRadius: `${theme.shape.borderRadiusLarge}px`,
    }),
    
    // Left drawer
    paperAnchorLeft: ({ theme }) => ({
      borderTopRightRadius: `${theme.shape.borderRadiusLarge}px`,
      borderBottomRightRadius: `${theme.shape.borderRadiusLarge}px`,
    }),
  },
};

export default MuiDrawer;
