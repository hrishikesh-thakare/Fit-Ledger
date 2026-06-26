export const KG_TO_LB = 2.20462;

export function fromKg(weightInKg: number, preferredUnit: 'kg' | 'lb' | string = 'kg'): number {
  if (!weightInKg) return 0;
  return preferredUnit === 'lb' ? weightInKg * KG_TO_LB : weightInKg;
}

export function toKg(weight: number, preferredUnit: 'kg' | 'lb' | string = 'kg'): number {
  if (!weight) return 0;
  return preferredUnit === 'lb' ? weight / KG_TO_LB : weight;
}
