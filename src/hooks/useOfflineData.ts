'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { offlineDb } from '@/lib/offline/db'

type OfflineCollection = 'exercises' | 'routines'

/**
 * Offline-first data hook for read-only cached collections.
 *
 * Behaviour:
 *  - Online:  Show skeletons → fetch API → show full data (cache in background)
 *  - Offline: Show cached data immediately (best-effort)
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
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine

      if (isOnline) {
        // Online: skip cache, wait for API to return complete data
        try {
          const res = await fetch(fetchUrl, { credentials: 'include' })
          if (res.ok && !cancelled) {
            const json = await res.json()
            const docs = json.docs ?? json
            setData(docs)
            setSource('server')
          }
        } catch {
          // Network failed even though navigator.onLine was true — fall back to cache
          const cached = await readFromCache()
          if (!cancelled) {
            setData(cached)
            setSource('cache')
          }
        }
      } else {
        // Offline: show cached data immediately
        const cached = await readFromCache()
        if (!cancelled) {
          setData(cached)
          setSource('cache')
        }
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
      mountedRef.current = false
    }
  }, [collection, fetchUrl, readFromCache])

  return { data, loading, source }
}
