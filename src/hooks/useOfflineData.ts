'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { offlineDb } from '@/lib/offline/db'

type OfflineCollection = 'exercises' | 'routines'

/**
 * IndexedDB-first data hook for read-only cached collections.
 *
 * Flow:
 *  1. Read from IndexedDB immediately
 *  2. If cache has data → show it, loading=false
 *  3. Attempt API fetch in background
 *  4. On API success → update state + IndexedDB, loading=false
 *  5. On API failure → if cache was empty, loading=false with empty data
 *
 * This ensures cards don't render half-loaded —
 * loading stays true until we have COMPLETE data from either source.
 */
export function useOfflineData<T>(collection: OfflineCollection, fetchUrl: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'cache' | 'server'>('cache')
  const mountedRef = useRef(true)

  // Read from IndexedDB
  const readFromCache = useCallback(async (): Promise<T[]> => {
    try {
      return (await offlineDb.table(collection).toArray()) as T[]
    } catch (err) {
      console.error(`[Offline] Failed to read ${collection} from cache`, err)
      return []
    }
  }, [collection])

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    async function load() {
      // Step 1: Read from IndexedDB
      const cached = await readFromCache()
      const hasCachedData = cached.length > 0

      if (hasCachedData && !cancelled) {
        // Cache has data — show it immediately, stop loading
        setData(cached)
        setSource('cache')
        setLoading(false)
      }

      // Step 2: Background refresh from API
      try {
        const res = await fetch(fetchUrl, { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const docs = json.docs ?? json
          if (!cancelled) {
            setData(docs)
            setSource('server')
            setLoading(false)
          }
        } else if (!hasCachedData && !cancelled) {
          // API failed and no cache — stop loading with empty data
          setLoading(false)
        }
      } catch {
        // Network error — if we had cached data it's already showing
        // If not, stop loading with whatever we have
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
      mountedRef.current = false
    }
  }, [collection, fetchUrl, readFromCache])

  return { data, loading, source }
}
