import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { listRoutinesFromPayload } from '@/lib/api-logic/routines/list'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const payload = await getPayloadClient()
  const userId = req.nextUrl.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ errors: [{ message: 'User ID is required' }] }, { status: 400 })
  }

  const result = await listRoutinesFromPayload(payload, userId)
  return NextResponse.json(result.body, { status: result.status, headers: result.headers })
}
