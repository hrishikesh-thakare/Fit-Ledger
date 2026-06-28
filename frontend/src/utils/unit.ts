export const KG_TO_LB = 2.20462;

export function fromKg(weightInKg: number, preferredUnit: 'kg' | 'lb' | string = 'kg', snapToHalf: boolean = false): number {
  if (!weightInKg) return 0;
  if (preferredUnit === 'lb') {
    const lb = weightInKg * KG_TO_LB;
    return snapToHalf ? Math.round(lb * 2) / 2 : lb;
  }
  return weightInKg;
}

export function toKg(weight: number, preferredUnit: 'kg' | 'lb' | string = 'kg'): number {
  if (!weight) return 0;
  return preferredUnit === 'lb' ? weight / KG_TO_LB : weight;
}
