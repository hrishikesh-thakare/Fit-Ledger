/**
 * TypeScript augmentation for MUI theme
 * Extends the palette and typography interfaces with MD3 tokens
 */

import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
    surfaceBright: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
    surfaceBright?: string;
    surfaceContainerLowest?: string;
    surfaceContainerLow?: string;
    surfaceContainer?: string;
    surfaceContainerHigh?: string;
    surfaceContainerHighest?: string;
    onSurface?: string;
    onSurfaceVariant?: string;
    outline?: string;
    outlineVariant?: string;
  }

  interface TypographyVariants {
    displayLarge: React.CSSProperties;
    displayMedium: React.CSSProperties;
    displaySmall: React.CSSProperties;
    headlineLarge: React.CSSProperties;
    headlineMedium: React.CSSProperties;
    headlineSmall: React.CSSProperties;
    titleLarge: React.CSSProperties;
    titleMedium: React.CSSProperties;
    titleSmall: React.CSSProperties;
    bodyLarge: React.CSSProperties;
    bodyMedium: React.CSSProperties;
    bodySmall: React.CSSProperties;
    labelLarge: React.CSSProperties;
    labelMedium: React.CSSProperties;
    labelSmall: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    displayLarge?: React.CSSProperties;
    displayMedium?: React.CSSProperties;
    displaySmall?: React.CSSProperties;
    headlineLarge?: React.CSSProperties;
    headlineMedium?: React.CSSProperties;
    headlineSmall?: React.CSSProperties;
    titleLarge?: React.CSSProperties;
    titleMedium?: React.CSSProperties;
    titleSmall?: React.CSSProperties;
    bodyLarge?: React.CSSProperties;
    bodyMedium?: React.CSSProperties;
    bodySmall?: React.CSSProperties;
    labelLarge?: React.CSSProperties;
    labelMedium?: React.CSSProperties;
    labelSmall?: React.CSSProperties;
  }

  interface Shape {
    borderRadiusExtraSmall: number;
    borderRadiusSmall: number;
    borderRadiusMedium: number;
    borderRadiusLarge: number;
    borderRadiusExtraLarge: number;
    borderRadiusFull: number;
  }

  interface Transitions {
    easing: {
      easeInOut: string;
      easeOut: string;
      easeIn: string;
      sharp: string;
      emphasized: string;
      emphasizedDecelerate: string;
      emphasizedAccelerate: string;
      standard: string;
      standardDecelerate: string;
      standardAccelerate: string;
    };
    duration: {
      shortest: number;
      shorter: number;
      short: number;
      standard: number;
      complex: number;
      enteringScreen: number;
      leavingScreen: number;
      emphasized: number;
      emphasizedIn: number;
      emphasizedOut: number;
    };
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    displayLarge: true;
    displayMedium: true;
    displaySmall: true;
    headlineLarge: true;
    headlineMedium: true;
    headlineSmall: true;
    titleLarge: true;
    titleMedium: true;
    titleSmall: true;
    bodyLarge: true;
    bodyMedium: true;
    bodySmall: true;
    labelLarge: true;
    labelMedium: true;
    labelSmall: true;
  }
}
