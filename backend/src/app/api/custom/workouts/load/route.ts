import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { loadWorkoutFromPayload } from '@/lib/api-logic/workouts/load'

export async function GET(req: NextRequest) {
  const payload = await getPayloadClient()
  const routineId = req.nextUrl.searchParams.get('routineId')
  const userId = req.nextUrl.searchParams.get('userId')

  if (!routineId) {
    return NextResponse.json({ error: 'routineId is required' }, { status: 400 })
  }

  const result = await loadWorkoutFromPayload(payload, { routineId, userId: userId ?? undefined })

  if (result.status !== 200) {
    return NextResponse.json(result.body, { status: result.status })
  }

  return NextResponse.json(result.body, { status: result.status, headers: result.headers })
}
