import { useRef, useEffect, useState, useCallback } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  maxPull?: number
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean
  pullDistance: number
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Pull-to-refresh hook for mobile-like refresh on list pages.
 * Attach containerRef to the scrollable container (or use on body).
 * Shows a pull indicator and triggers onRefresh when pulled past threshold.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const pulling = useRef(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [onRefresh])

  useEffect(() => {
    const el = containerRef.current || document.documentElement

    const onTouchStart = (e: TouchEvent) => {
      // Only activate when at the top of the scroll
      if (window.scrollY <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY
        pulling.current = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || isRefreshing) return
      const deltaY = e.touches[0].clientY - startY.current
      if (deltaY > 0) {
        // Apply resistance curve
        const distance = Math.min(maxPull, deltaY * 0.5)
        setPullDistance(distance)
        if (distance > 10 && e.cancelable) {
          e.preventDefault()
        }
      } else {
        pulling.current = false
        setPullDistance(0)
      }
    }

    const onTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullDistance >= threshold) {
        handleRefresh()
      } else {
        setPullDistance(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [isRefreshing, pullDistance, threshold, maxPull, handleRefresh])

  return { isRefreshing, pullDistance, containerRef }
}
