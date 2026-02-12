'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export const PageLoadTracker = () => {
  const pathname = usePathname()

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now()
      const logLoad = () => {
        const duration = performance.now() - start
        console.log(`[Page Load] ${pathname}: ${duration.toFixed(2)}ms`)
      }

      if (document.readyState === 'complete') {
        logLoad()
      } else {
        window.addEventListener('load', logLoad)
        return () => window.removeEventListener('load', logLoad)
      }
    }
  }, [pathname])

  return null
}
