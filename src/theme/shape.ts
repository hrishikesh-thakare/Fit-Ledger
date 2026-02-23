/**
 * Material Design 3 Shape System - Border Radius
 * 3-tier system: sm(12), md(16), lg(24) + xs(8) and full(pill)
 */

const shape = {
  borderRadius: 12, // Global default fallback

  // MD3 shape tokens
  borderRadiusExtraSmall: 8,   // Small chips, badges
  borderRadiusSmall: 12,       // Inputs, buttons, icon buttons
  borderRadiusMedium: 16,      // Cards, papers, containers
  borderRadiusLarge: 24,       // Dialogs, drawers, bottom sheets
  borderRadiusExtraLarge: 28,  // Alias for large (legacy compat)
  borderRadiusFull: 9999,      // Pills
}

export default shape
