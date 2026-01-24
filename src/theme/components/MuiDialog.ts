import { Components, Theme } from '@mui/material/styles'

const MuiDialog: Components<Theme>['MuiDialog'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      backgroundColor: theme.palette.surfaceContainerHigh || theme.palette.background.paper,
      borderRadius: '28px',
      boxShadow: theme.shadows[3],
    }),
  },
}

export default MuiDialog
