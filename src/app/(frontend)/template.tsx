import React from 'react'
import { ServerPageLogger } from '@/components/ServerPageLogger'
import { OfflinePrefetch } from './OfflinePrefetch'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ServerPageLogger>
      <OfflinePrefetch />
      {children}
    </ServerPageLogger>
  )
}
