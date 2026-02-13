import React from 'react'
import { ServerPageLogger } from '@/components/ServerPageLogger'

export default function Template({ children }: { children: React.ReactNode }) {
  return <ServerPageLogger>{children}</ServerPageLogger>
}
