export const colors = {
  // Backgrounds & Surfaces
  background: '#000000',
  surface: '#000000',
  surfaceElevated: '#000000',
  surfaceVariant: '#000000',
  surfaceDropdown: '#000000',
  
  // Borders & Dividers
  border: '#1A1A1A',
  borderLight: '#1F1F21',
  borderInput: '#2D2D30',
  
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
  error: '#EF4444',
  errorBackground: '#3F2222',
  destructive: '#7F1D1D',
  
  // Overlays
  overlay: 'rgba(0,0,0,0.85)',
  overlayLight: 'rgba(0,0,0,0.8)',
};

export const typography = {
  headerTitle: { fontSize: 28, fontWeight: '400' as const, lineHeight: 36, color: colors.text },
  cardTitle: { fontSize: 22, fontWeight: '400' as const, lineHeight: 28, color: colors.text },
};

export const theme = {
  colors,
  typography,
};

export default theme;
