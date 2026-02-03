import { Components, Theme } from '@mui/material/styles';

/**
 * Material Design Skeleton with shimmer animation
 */
const MuiSkeleton: Components<Theme>['MuiSkeleton'] = {
  defaultProps: {
    animation: 'wave',
  },
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.action.hover,
      
      // Enhanced wave animation
      '&.MuiSkeleton-wave::after': {
        background: `linear-gradient(
          90deg,
          transparent,
          ${theme.palette.action.selected},
          transparent
        )`,
        animationDuration: '1.6s',
      },
    }),
    
    text: {
      borderRadius: '4px',
    },
    
    rectangular: {
      borderRadius: '8px',
    },
    
    rounded: {
      borderRadius: '28px',
    },
    
    circular: {
      borderRadius: '50%',
    },
  },
};

export default MuiSkeleton;
