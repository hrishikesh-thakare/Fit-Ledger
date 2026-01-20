/**
 * Material Design 3 Color Palette - Dark Mode
 * Following Android Material You design system
 */

const palette = {
  mode: 'dark' as const,
  
  // Primary - Purple theme for fitness/wellness
  primary: {
    main: '#D0BCFF',
    light: '#EADDFF',
    dark: '#6750A4',
    contrastText: '#381E72',
  },
  
  // Secondary
  secondary: {
    main: '#CCC2DC',
    light: '#E8DEF8',
    dark: '#625B71',
    contrastText: '#332D41',
  },
  
  // Tertiary - Accent colors
  tertiary: {
    main: '#EFB8C8',
    light: '#FFD8E4',
    dark: '#7D5260',
    contrastText: '#492532',
  },
  
  // Error
  error: {
    main: '#F2B8B5',
    light: '#F9DEDC',
    dark: '#8C1D18',
    contrastText: '#601410',
  },
  
  // Warning
  warning: {
    main: '#FFB951',
    light: '#FFDDB3',
    dark: '#8B5A00',
    contrastText: '#2E1800',
  },
  
  // Info
  info: {
    main: '#A0CAFD',
    light: '#D1E4FF',
    dark: '#004A77',
    contrastText: '#003258',
  },
  
  // Success
  success: {
    main: '#B7E4C7',
    light: '#D8F3DC',
    dark: '#2D6A4F',
    contrastText: '#1B4332',
  },
  
  // Text colors
  text: {
    primary: '#E6E1E5',
    secondary: '#CAC4D0',
    disabled: '#938F99',
  },
  
  // Background surfaces following MD3 surface tones
  background: {
    default: '#1B1B1F', // Surface Dim
    paper: '#1B1B1F',   // Surface
  },
  
  // Surface variants
  surfaceBright: '#313033',
  surfaceContainerLowest: '#0F0D13',
  surfaceContainerLow: '#1B1B1F',
  surfaceContainer: '#211F26',
  surfaceContainerHigh: '#2B2930',
  surfaceContainerHighest: '#36343B',
  
  // Additional surface tones
  onSurface: '#E6E1E5',
  onSurfaceVariant: '#CAC4D0',
  
  // Dividers and outlines
  divider: '#49454F',
  outline: '#938F99',
  outlineVariant: '#49454F',
  
  // Common colors
  common: {
    black: '#000000',
    white: '#FFFFFF',
  },
  
  // Grey scale
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Action colors
  action: {
    active: '#E6E1E5',
    hover: 'rgba(230, 225, 229, 0.08)',
    hoverOpacity: 0.08,
    selected: 'rgba(208, 188, 255, 0.12)',
    selectedOpacity: 0.12,
    disabled: '#938F99',
    disabledBackground: 'rgba(230, 225, 229, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(208, 188, 255, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.12,
  },
};

export default palette;
