'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Tracks browser online/offline state and fires a custom event
 * (`fitledger:back-online`) when connectivity is restored so the
 * sync manager can flush its queue.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [wasOffline, setWasOffline] = useState(false)

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    setWasOffline((prev) => {
      if (prev) {
        window.dispatchEvent(new CustomEvent('fitledger:back-online'))
      }
      return false
    })
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(true)
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return { isOnline, wasOffline }
}
