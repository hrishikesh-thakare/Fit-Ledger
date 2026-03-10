import { offlineDb } from './db'

/**
 * Pre-caches read-only reference data (exercises, routines) into IndexedDB
 * so they are available when the user goes offline.
 *
 * Called by BackgroundSyncContext on mount and when back online.
 * Failures are logged with context — never silently swallowed.
 */
export async function preCacheData(userId?: string | number): Promise<void> {
  const tasks: Promise<void>[] = [cacheExercises(), cacheAppPages()]
  if (userId) tasks.push(cacheRoutines(String(userId)))

  const results = await Promise.allSettled(tasks)

  const failures = results.filter((r) => r.status === 'rejected')
  if (failures.length > 0) {
    console.warn(
      `[Cache] Pre-cache completed with ${failures.length} failure(s):`,
      failures.map((f) => (f as PromiseRejectedResult).reason),
    )
  } else {
    console.log('[Cache] Pre-cache complete')
  }
}

// ── App Pages (HTML shell caching for offline navigation) ────────

const APP_PAGES = [
  '/dashboard',
  '/routines',
  '/bodyweight',
  '/history',
  '/profile',
  '/workout/summary',
]

async function cacheAppPages(): Promise<void> {
  if (typeof caches === 'undefined') return // SSR guard

  // Use 'pages' cache — matches the SW's default Workbox cache name for page navigations
  const cache = await caches.open('pages')
  const fetchPromises = APP_PAGES.map(async (page) => {
    try {
      const res = await fetch(page, { credentials: 'include' })
      if (res.ok) {
        await cache.put(page, res)
      }
    } catch {
      // Non-critical — page will use fallback offline page if not cached
    }
  })
  await Promise.all(fetchPromises)
}

// ── Exercises ────────────────────────────────────────────────────

async function cacheExercises(): Promise<void> {
  const res = await fetch('/api/custom/exercises', { credentials: 'include' })
  if (!res.ok) throw new Error(`Failed to fetch exercises: ${res.status}`)

  const data = await res.json()
  const docs: {
    id: string | number
    name?: string
    muscleGroup?: { id?: string | number; name?: string } | string | number
    equipment?: string
  }[] = data.docs ?? data

  await offlineDb.exercises.clear()
  await offlineDb.exercises.bulkPut(
    docs.map((ex) => ({
      id: String(ex.id),
      name: ex.name ?? '',
      muscleGroupId: String(
        typeof ex.muscleGroup === 'object' ? (ex.muscleGroup?.id ?? '') : (ex.muscleGroup ?? ''),
      ),
      muscleGroupName: typeof ex.muscleGroup === 'object' ? (ex.muscleGroup?.name ?? '') : '',
      equipment: ex.equipment ?? '',
      cachedAt: new Date().toISOString(),
    })),
  )
}

// ── Routines ─────────────────────────────────────────────────────

async function cacheRoutines(userId: string): Promise<void> {
  const res = await fetch(`/api/custom/routines?userId=${userId}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`Failed to fetch routines: ${res.status}`)

  const data = await res.json()
  const docs: {
    id: string | number
    name?: string
    description?: string
    exerciseCount?: number
    duration?: string
    previewExercises?: string[]
    muscleGroups?: string[]
    exercises?: {
      exercise?: { id?: string | number; name?: string } | string | number
      name?: string
      sets?: { type?: string; reps?: string | number; weight?: string | number }[]
      order?: number
    }[]
  }[] = data.docs ?? data

  await offlineDb.routines.clear()
  await offlineDb.routines.bulkPut(
    docs.map((r) => ({
      id: String(r.id),
      name: r.name ?? '',
      description: r.description ?? '',
      exerciseCount: r.exerciseCount ?? r.exercises?.length ?? 0,
      duration: r.duration ?? '~0m',
      previewExercises:
        r.previewExercises ??
        (r.exercises ?? [])
          .map(
            (re) =>
              (typeof re.exercise === 'object' ? re.exercise?.name : undefined) ?? re.name ?? '',
          )
          .filter((name) => name.length > 0)
          .slice(0, 3),
      muscleGroups: r.muscleGroups ?? [],
      exercises: (r.exercises ?? []).map((re) => ({
        exerciseId: String(
          typeof re.exercise === 'object' ? (re.exercise?.id ?? '') : (re.exercise ?? ''),
        ),
        exerciseName:
          (typeof re.exercise === 'object' ? re.exercise?.name : undefined) ?? re.name ?? '',
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
