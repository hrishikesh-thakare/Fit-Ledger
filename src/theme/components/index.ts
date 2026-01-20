/**
 * Material Design 3 Component Overrides
 * Combines all component style overrides
 */

import { Components, Theme } from '@mui/material/styles';
import MuiButton from './MuiButton';
import MuiCard from './MuiCard';
import MuiCardContent from './MuiCardContent';
import MuiTextField from './MuiTextField';
import MuiOutlinedInput from './MuiOutlinedInput';
import MuiInputLabel from './MuiInputLabel';
import MuiAppBar from './MuiAppBar';
import MuiToolbar from './MuiToolbar';
import MuiBottomNavigation from './MuiBottomNavigation';
import MuiBottomNavigationAction from './MuiBottomNavigationAction';
import MuiFab from './MuiFab';
import MuiChip from './MuiChip';
import MuiIconButton from './MuiIconButton';
import MuiListItem from './MuiListItem';
import MuiListItemButton from './MuiListItemButton';
import MuiDivider from './MuiDivider';
import MuiCheckbox from './MuiCheckbox';
import MuiDialog from './MuiDialog';

const components: Components<Theme> = {
  MuiButton,
  MuiCard,
  MuiCardContent,
  MuiTextField,
  MuiOutlinedInput,
  MuiInputLabel,
  MuiAppBar,
  MuiToolbar,
  MuiBottomNavigation,
  MuiBottomNavigationAction,
  MuiFab,
  MuiChip,
  MuiIconButton,
  MuiListItem,
  MuiListItemButton,
  MuiDivider,
  MuiCheckbox,
  MuiDialog,
  
  // CssBaseline for global resets
  MuiCssBaseline: {
    styleOverrides: (theme: Theme) => ({
      '*': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      },
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        height: '100%',
        width: '100%',
      },
      body: {
        height: '100%',
        width: '100%',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        fontFamily: theme.typography.fontFamily,
        overflowX: 'hidden',
      },
      '#__next': {
        height: '100%',
        width: '100%',
      },
      // Improve text rendering
      'input, textarea, select, button': {
        fontFamily: 'inherit',
      },
      // Remove default outline and add custom focus styles
      '*:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '2px',
      },
      // Smooth scrolling
      '@media (prefers-reduced-motion: no-preference)': {
        html: {
          scrollBehavior: 'smooth',
        },
      },
    }),
  },
};

export default components;
