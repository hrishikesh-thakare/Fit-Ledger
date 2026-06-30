/**
 * Fit Ledger — Dark Mode Theme
 *
 * Color system based on Apple HIG elevation model:
 *   - Base surfaces are dimmer → background recedes
 *   - Elevated surfaces are brighter → foreground advances
 *   - No pure #000000/#FFFFFF pairing to avoid visual fatigue
 *
 * Primary orange desaturated from #FF5A00 → #FF6935 to reduce
 * "vibration" against dark backgrounds.
 *
 * Typography follows dark-mode best practices: slightly heavier
 * weights, generous line-height (~1.5×), and deliberate letter-spacing.
 */

export const darkColors = {
  // Background fills
  background:       '#1C1A19',   // Screen background
  surface:          '#262321',   // Cards, list items
  surfaceElevated:  '#302C29',   // Bottom sheets, navigation
  surfaceVariant:   '#3A3532',   // Chips, text fields
  surfaceDropdown:  '#45403D',   // Menus, popups

  // Borders
  border:           'transparent',
  borderLight:      'rgba(255,255,255,0.04)',
  borderInput:      'rgba(255,255,255,0.10)',

  // Typography
  text:             '#F4F3EE',   // Warm Cream
  textSecondary:    '#B1ADA1',   // Muted Sand
  textMuted:        '#827E76',
  textDisabled:     '#5D5953',

  // Brand Colors
  primary:          '#C15F3C',
  primaryPressed:   '#AA5335',
  primaryLight:     'rgba(193,95,60,0.15)',

  // Status Colors
  success:          '#3CB371',
  successBackground:'rgba(60,179,113,0.15)',
  warning:          '#D9A441',
  warningBackground:'rgba(217,164,65,0.15)',
  error:            '#D65A4A',
  errorBackground:  'rgba(214,90,74,0.15)',
  errorLight:       'rgba(214,90,74,0.15)',
  errorBorder:      'rgba(214,90,74,0.3)',
  destructive:      '#B71C1C',

  // Utilities
  overlay:          'rgba(28,26,25,0.85)',
  overlayLight:     'rgba(28,26,25,0.6)',
  shadow:           'rgba(0,0,0,0.35)',
  divider:          'rgba(255,255,255,0.05)',
  scrim:            'rgba(0,0,0,0.55)',
};

export const lightColors = {
  background:       '#F4F3EE',   // Warm cream
  surface:          '#FFFFFF',   // Pure White
  surfaceElevated:  '#EAE9E4',   // Slightly darker than background for sheets
  surfaceVariant:   '#EAE9E4',
  surfaceDropdown:  '#FFFFFF',

  border:           'transparent',
  borderLight:      'rgba(0,0,0,0.06)',
  borderInput:      'rgba(0,0,0,0.12)',

  text:             '#2C2927',   // Dark Charcoal
  textSecondary:    '#706D67',   // Medium Charcoal
  textMuted:        '#9A9791',
  textDisabled:     '#BDBBB6',

  primary:          '#C15F3C',
  primaryPressed:   '#AA5335',
  primaryLight:     'rgba(193,95,60,0.15)',

  success:          '#2E8B57',
  successBackground:'rgba(46,139,87,0.15)',
  warning:          '#B27B2B',
  warningBackground:'rgba(178,123,43,0.15)',
  error:            '#C62828',
  errorBackground:  'rgba(198,40,40,0.15)',
  errorLight:       'rgba(198,40,40,0.15)',
  errorBorder:      'rgba(198,40,40,0.3)',
  destructive:      '#B71C1C',

  overlay:          'rgba(244,243,238,0.85)',
  overlayLight:     'rgba(244,243,238,0.6)',
  shadow:           'rgba(0,0,0,0.15)',
  divider:          'rgba(0,0,0,0.06)',
  scrim:            'rgba(0,0,0,0.3)',
};

// We temporarily export `colors = darkColors` to avoid breaking existing imports 
// during the transition to the ThemeContext.
export const colors = darkColors;
export type ColorsType = typeof darkColors;

export const typography = {
  display:     { fontSize: 32, fontWeight: '700'  as const, lineHeight: 40, letterSpacing: -0.5 },
  heading:     { fontSize: 24, fontWeight: '700'  as const, lineHeight: 32, letterSpacing: -0.3 },
  subheading:  { fontSize: 18, fontWeight: '600'  as const, lineHeight: 26, letterSpacing: -0.2 },
  body:        { fontSize: 16, fontWeight: '400'  as const, lineHeight: 26 },
  bodySmall:   { fontSize: 14, fontWeight: '400'  as const, lineHeight: 22 },
  label:       { fontSize: 13, fontWeight: '600'  as const, lineHeight: 18, letterSpacing: 0.2 },
  caption:     { fontSize: 12, fontWeight: '500'  as const, lineHeight: 18 },
  headerTitle: { fontSize: 28, fontWeight: '600'  as const, lineHeight: 36 },
  cardTitle:   { fontSize: 20, fontWeight: '600'  as const, lineHeight: 28 },
};

export const layout = {
  tabBarHeight: 68,
};

export const theme = {
  colors: darkColors,
  typography,
  layout,
};

export default theme;
