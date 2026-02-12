export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  return { result, duration }
}

export function formatServerTimingHeader(timings: Record<string, number>): string {
  return Object.entries(timings)
    .map(([name, duration]) => `${name};dur=${duration.toFixed(2)}`)
    .join(', ')
}

export function logTiming(route: string, timings: Record<string, number>) {
  console.log(`[API] ${route}`)
  Object.entries(timings).forEach(([name, duration]) => {
    console.log(`${name}: ${duration.toFixed(2)}ms`)
  })
}
