export const capitalize = (str: string) => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const getMuscle = (e: any) => {
  const val = e?.muscleGroup?.name || e?.bodyPart || e?.muscleGroup
  return typeof val === 'string' ? capitalize(val) : null
}

export const getEquipment = (e: any) => {
  const val = e?.equipment
  return val ? capitalize(val) : null
}

export const getSetLabelDisplay = (label: string) => {
  if (!label) return 'Normal'
  const map: Record<string, string> = {
    working: 'Normal',
    warmup: 'Warmup',
    drop: 'Drop',
  }
  return map[label.toLowerCase()] || capitalize(label)
}

export const getSetLabelText = (exSets: { type?: string }[], idx: number) => {
  const set = exSets[idx]
  if (!set) return ''
  if (set.type === 'W' || set.type === 'Warmup') return 'W'
  if (set.type === 'D' || set.type === 'Drop' || set.type === 'Drop Set') return 'D'
  let normalCount = 0
  for (let i = 0; i <= idx; i++) {
    const s = exSets[i]
    if (s && (s.type === 'N' || s.type === 'Normal')) normalCount++
  }
  return normalCount.toString()
}
