import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import type { User } from '@/payload-types'

export async function getCurrentUser(): Promise<User | null> {
  const headersList = await headers()
  const payload = await getPayloadClient()

  const { user } = await payload.auth({ headers: headersList })

  return user || null
}
