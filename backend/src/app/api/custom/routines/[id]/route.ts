import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { getRoutineDetailsFromPayload } from '@/lib/api-logic/routines/details'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient()
  const { id } = await params
  const result = await getRoutineDetailsFromPayload(payload, id)

  if (result.status !== 200) {
    return NextResponse.json(result.body, { status: result.status })
  }

  return NextResponse.json(result.body, { status: result.status, headers: result.headers })
}
