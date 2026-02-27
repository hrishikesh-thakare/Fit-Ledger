// Weight conversion utilities
// Database canonical unit: kg

export const LBS_TO_KG = 0.453592
export const KG_TO_LBS = 2.20462

export type WeightUnit = 'kg' | 'lb'

/**
 * Convert weight to kg (database canonical unit)
 */
export function toKg(weight: number, fromUnit: WeightUnit): number {
  if (fromUnit === 'kg') return weight
  return weight * LBS_TO_KG
}

/**
 * Convert weight from kg (database) to display unit
 */
export function fromKg(weightInKg: number, toUnit: WeightUnit): number {
  if (toUnit === 'kg') return weightInKg
  return weightInKg * KG_TO_LBS
}

/**
 * Format weight for display with appropriate precision
 */
export function formatWeight(weightInKg: number, unit: WeightUnit, maxDecimals: number = 2): string {
  const displayWeight = fromKg(weightInKg, unit)
  // parseFloat strips trailing zeroes (e.g. 2.50 -> 2.5, 3.00 -> 3)
  return parseFloat(displayWeight.toFixed(maxDecimals)).toString()
}
