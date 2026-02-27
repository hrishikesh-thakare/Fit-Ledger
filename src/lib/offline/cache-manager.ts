import { offlineDb } from './db'

/**
 * Pre-caches read-only reference data (exercises, routines) into IndexedDB
 * so they are available when the user goes offline.
 *
 * Call once on app load when online. Non-critical — failures are silently logged.
 */
export async function preCacheData(userId?: string | number): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  try {
    const tasks: Promise<void>[] = [cacheExercises()]
    if (userId) tasks.push(cacheRoutines(String(userId)))
    await Promise.all(tasks)
    console.log('[Cache] Pre-cache complete')
  } catch (err) {
    console.warn('[Cache] Pre-cache failed (non-critical):', err)
  }
}

// ── Exercises ────────────────────────────────────────────────────

async function cacheExercises(): Promise<void> {
  const res = await fetch('/api/custom/exercises', { credentials: 'include' })
  if (!res.ok) return

  const data = await res.json()
  const docs: { id: string | number; name?: string; muscleGroup?: { id?: string | number; name?: string } | string | number; equipment?: string }[] = data.docs ?? data

  await offlineDb.exercises.clear()
  await offlineDb.exercises.bulkPut(
    docs.map((ex) => ({
      id: String(ex.id),
      name: ex.name ?? '',
      muscleGroupId: String(typeof ex.muscleGroup === 'object' ? ex.muscleGroup?.id ?? '' : ex.muscleGroup ?? ''),
      muscleGroupName: typeof ex.muscleGroup === 'object' ? ex.muscleGroup?.name ?? '' : '',
      equipment: ex.equipment ?? '',
      cachedAt: new Date().toISOString(),
    })),
  )
}

// ── Routines ─────────────────────────────────────────────────────

async function cacheRoutines(userId: string): Promise<void> {
  const res = await fetch(`/api/custom/routines?userId=${userId}`, { credentials: 'include' })
  if (!res.ok) return

  const data = await res.json()
  const docs: { id: string | number; name?: string; description?: string; exercises?: { exercise?: { id?: string | number; name?: string } | string | number; name?: string; sets?: { type?: string; reps?: string | number; weight?: string | number }[]; order?: number }[] }[] = data.docs ?? data

  await offlineDb.routines.clear()
  await offlineDb.routines.bulkPut(
    docs.map((r) => ({
      id: String(r.id),
      name: r.name ?? '',
      description: r.description ?? '',
      exercises: (r.exercises ?? []).map((re) => ({
        exerciseId: String(typeof re.exercise === 'object' ? re.exercise?.id ?? '' : re.exercise ?? ''),
        exerciseName: (typeof re.exercise === 'object' ? re.exercise?.name : undefined) ?? re.name ?? '',
        sets: (re.sets ?? []).map((s) => ({
          type: s.type ?? 'N',
          reps: String(s.reps ?? ''),
          weight: String(s.weight ?? ''),
        })),
        order: re.order ?? 0,
      })),
      cachedAt: new Date().toISOString(),
    })),
  )
}
