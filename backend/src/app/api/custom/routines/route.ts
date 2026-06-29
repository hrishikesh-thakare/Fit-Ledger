import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { listRoutinesFromPayload } from '@/lib/api-logic/routines/list'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const payload = await getPayloadClient()

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await listRoutinesFromPayload(payload, user.id)
  return NextResponse.json(result.body, { status: result.status, headers: result.headers })
}
