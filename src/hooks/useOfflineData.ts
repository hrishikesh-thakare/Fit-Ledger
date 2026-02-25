'use client'

import { useState, useEffect } from 'react'
import { offlineDb } from '@/lib/offline/db'
import { useOnlineStatus } from './useOnlineStatus'

type OfflineCollection = 'exercises' | 'routines'

/**
 * Reads data from the server when online; falls back to IndexedDB when offline.
 * Only used for read-only cached collections (exercises, routines).
 */
export function useOfflineData<T>(collection: OfflineCollection, fetchUrl: string) {
  const { isOnline } = useOnlineStatus()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'server' | 'cache'>('server')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      // Try server first when online
      if (isOnline) {
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
            return
          }
        } catch {
          // Fall through to cache
        }
      }

      // Offline fallback → IndexedDB
      try {
        const cached = await offlineDb.table(collection).toArray()
        if (!cancelled) {
          setData(cached as T[])
          setSource('cache')
        }
      } catch (err) {
        console.error(`[Offline] Failed to read ${collection} from cache`, err)
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [collection, fetchUrl, isOnline])

  return { data, loading, source, isOnline }
}
