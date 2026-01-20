/**
 * Material Design 3 Typography Scale - Android
 * Using Roboto font family (Android system default)
 * Scale based on Material Design 3 type system
 */

const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 16, // Base font size (Body Large)
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  
  // Display styles (rarely used in mobile)
  displayLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '3.5625rem', // 57px
    fontWeight: 400,
    lineHeight: 1.12,
    letterSpacing: '-0.25px',
  },
  
  displayMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '2.8125rem', // 45px
    fontWeight: 400,
    lineHeight: 1.16,
    letterSpacing: '0px',
  },
  
  displaySmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '2.25rem', // 36px
    fontWeight: 400,
    lineHeight: 1.22,
    letterSpacing: '0px',
  },
  
  // Headline styles
  headlineLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '2rem', // 32px
    fontWeight: 400,
    lineHeight: 1.25,
    letterSpacing: '0px',
  },
  
  headlineMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1.75rem', // 28px
    fontWeight: 400,
    lineHeight: 1.29,
    letterSpacing: '0px',
  },
  
  headlineSmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1.5rem', // 24px
    fontWeight: 400,
    lineHeight: 1.33,
    letterSpacing: '0px',
  },
  
  // Title styles
  titleLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1.375rem', // 22px
    fontWeight: 400,
    lineHeight: 1.27,
    letterSpacing: '0px',
  },
  
  titleMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem', // 16px
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.15px',
  },
  
  titleSmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.875rem', // 14px
    fontWeight: 500,
    lineHeight: 1.43,
    letterSpacing: '0.1px',
  },
  
  // Body styles
  bodyLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem', // 16px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.5px',
  },
  
  bodyMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.875rem', // 14px
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.25px',
  },
  
  bodySmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.75rem', // 12px
    fontWeight: 400,
    lineHeight: 1.33,
    letterSpacing: '0.4px',
  },
  
  // Label styles
  labelLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.875rem', // 14px
    fontWeight: 500,
    lineHeight: 1.43,
    letterSpacing: '0.1px',
  },
  
  labelMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.75rem', // 12px
    fontWeight: 500,
    lineHeight: 1.33,
    letterSpacing: '0.5px',
  },
  
  labelSmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.6875rem', // 11px
    fontWeight: 500,
    lineHeight: 1.45,
    letterSpacing: '0.5px',
  },
  
  // Legacy MUI variants (mapped to MD3)
  h1: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '2rem', // 32px - headlineLarge
    fontWeight: 400,
    lineHeight: 1.25,
    letterSpacing: '0px',
  },
  
  h2: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1.75rem', // 28px - headlineMedium
    fontWeight: 400,
    lineHeight: 1.29,
    letterSpacing: '0px',
  },
  
  h3: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1.5rem', // 24px - headlineSmall
    fontWeight: 400,
    lineHeight: 1.33,
    letterSpacing: '0px',
  },
  
  h4: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1.375rem', // 22px - titleLarge
    fontWeight: 400,
    lineHeight: 1.27,
    letterSpacing: '0px',
  },
  
  h5: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1.125rem', // 18px
    fontWeight: 400,
    lineHeight: 1.33,
    letterSpacing: '0px',
  },
  
  h6: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem', // 16px - titleMedium
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.15px',
  },
  
  subtitle1: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem', // 16px - titleMedium
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.15px',
  },
  
  subtitle2: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.875rem', // 14px - titleSmall
    fontWeight: 500,
    lineHeight: 1.43,
    letterSpacing: '0.1px',
  },
  
  body1: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '1rem', // 16px - bodyLarge
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.5px',
  },
  
  body2: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.875rem', // 14px - bodyMedium
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.25px',
  },
  
  button: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.875rem', // 14px - labelLarge
    fontWeight: 500,
    lineHeight: 1.43,
    letterSpacing: '0.1px',
    textTransform: 'none' as const,
  },
  
  caption: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.75rem', // 12px - bodySmall
    fontWeight: 400,
    lineHeight: 1.33,
    letterSpacing: '0.4px',
  },
  
  overline: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.75rem', // 12px - labelMedium
    fontWeight: 500,
    lineHeight: 1.33,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
};

export default typography;
