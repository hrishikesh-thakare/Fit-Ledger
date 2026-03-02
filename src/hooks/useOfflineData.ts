'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { offlineDb } from '@/lib/offline/db'

type OfflineCollection = 'exercises' | 'routines'

/**
 * IndexedDB-first data hook for read-only cached collections.
 *
 * Flow:
 *  1. Read from IndexedDB immediately → show data, loading=false
 *  2. Attempt API fetch in background (non-blocking)
 *  3. On success → update IndexedDB → re-read → update state
 *  4. On failure → no-op (IndexedDB data is already showing)
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
      // Step 1: Read from IndexedDB immediately
      const cached = await readFromCache()
      if (!cancelled) {
        setData(cached)
        setSource('cache')
        setLoading(false) // Show data right away
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
          }
        }
      } catch {
        // Network error — cached data is already showing, no-op
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
