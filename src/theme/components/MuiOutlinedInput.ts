import { Components, Theme } from '@mui/material/styles';

const MuiOutlinedInput: Components<Theme>['MuiOutlinedInput'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: (theme.palette as any).surfaceContainerHighest || theme.palette.background.paper,
      borderRadius: '12px',
      minHeight: '56px',
      color: theme.palette.text.primary,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.outline,
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
      },
      '&.Mui-error .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.error.main,
      },
    }),
    input: {
      padding: '16px 14px',
      fontSize: '1rem',
    },
    inputSizeSmall: {
      padding: '12px 14px',
      fontSize: '0.875rem',
    },
  },
};

export default MuiOutlinedInput;
