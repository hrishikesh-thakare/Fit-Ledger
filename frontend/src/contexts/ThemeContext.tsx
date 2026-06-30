import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, typography, layout, ColorsType } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorsType;
  typography: typeof typography;
  layout: typeof layout;
  setMode: (mode: ThemeMode) => void;
  theme: {
    colors: ColorsType;
    typography: typeof typography;
    layout: typeof layout;
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    // Load saved mode
    const loadMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('@theme_mode');
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (e) {
        console.error('Failed to load theme mode', e);
      }
    };
    loadMode();

    // Listen for system changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem('@theme_mode', newMode);
    } catch (e) {
      console.error('Failed to save theme mode', e);
    }
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const dynamicTypography = {
    display:     { ...typography.display, color: colors.text },
    heading:     { ...typography.heading, color: colors.text },
    subheading:  { ...typography.subheading, color: colors.text },
    body:        { ...typography.body, color: colors.text },
    bodySmall:   { ...typography.bodySmall, color: colors.text },
    label:       { ...typography.label, color: colors.text },
    caption:     { ...typography.caption, color: colors.textMuted },
    headerTitle: { ...typography.headerTitle, color: colors.text },
    cardTitle:   { ...typography.cardTitle, color: colors.text },
  };

  return (
    <ThemeContext.Provider value={{ 
      mode, 
      isDark, 
      colors, 
      typography: dynamicTypography, 
      layout, 
      setMode, 
      theme: { colors, typography: dynamicTypography, layout } 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
