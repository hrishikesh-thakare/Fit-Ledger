'use client'

import { useEffect } from 'react'
import { preCacheData } from '@/lib/offline/cache-manager'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Tiny client component mounted in the template.
 * Fires once per navigation to pre-cache reference data into IndexedDB.
 */
export function OfflinePrefetch() {
  const { user } = useAuth()

  useEffect(() => {
    preCacheData(user?.id)
  }, [user?.id])

  return null
}
