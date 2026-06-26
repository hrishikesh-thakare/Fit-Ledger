export const colors = {
  // Background fills — pure black (no grey surfaces)
  background: '#000000',
  surface: '#000000',
  surfaceElevated: '#000000',
  surfaceVariant: '#000000',
  surfaceDropdown: '#000000',
  
  // Lines & outlines — keep grey (not fills)
  border: '#2D2D30',
  borderLight: '#1F1F21',
  borderInput: '#3C3C3E',
  
  // Shadows
  shadow: '#000000',
  
  // Text & Typography
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textDisabled: '#6B7280',
  
  // Brand & Accents
  primary: '#FF5A00',
  primaryLight: 'rgba(255, 90, 0, 0.08)',
  
  // Status Colors
  success: '#4ADE80',
  successBackground: '#1A2F24',
  error: '#FF3B30',
  errorLight: 'rgba(255, 59, 48, 0.1)',
  errorBorder: 'rgba(255, 59, 48, 0.3)',
  errorBackground: '#3F2222',
  destructive: '#7F1D1D',
  
  // Overlays
  overlay: 'rgba(0,0,0,0.85)',
  overlayLight: 'rgba(0,0,0,0.8)',
};

export const typography = {
  display: { fontSize: 32, fontWeight: '800' as const, color: colors.text },
  heading: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.text },
  label: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
  headerTitle: { fontSize: 28, fontWeight: '400' as const, lineHeight: 36, color: colors.text },
  cardTitle: { fontSize: 22, fontWeight: '400' as const, lineHeight: 28, color: colors.text },
};

export const layout = {
  tabBarHeight: 68,
};

export const theme = {
  colors,
  typography,
  layout,
};

export default theme;
