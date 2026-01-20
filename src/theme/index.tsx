'use client';

/**
 * Material Design 3 Theme Configuration
 * Main theme export with ThemeProvider and CacheProvider
 */

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { ReactNode } from 'react';

import palette from './palette';
import typography from './typography';
import shape from './shape';
import shadows from './shadows';
import transitions from './transitions';
import components from './components';

// Create Emotion cache
const createEmotionCache = () => {
  return createCache({
    key: 'mui',
    prepend: true, // Theme styles will be inserted at lower precedence
  });
};

const emotionCache = createEmotionCache();

// Create MUI theme
const theme = createTheme({
  palette,
  typography,
  shape,
  shadows,
  transitions,
  components,
  spacing: 8, // 8px base spacing unit
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// ThemeProvider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <CacheProvider value={emotionCache}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  );
}

export default theme;
