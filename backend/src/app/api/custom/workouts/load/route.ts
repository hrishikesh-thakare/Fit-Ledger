import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { loadWorkoutFromPayload } from '@/lib/api-logic/workouts/load'

export async function GET(req: NextRequest) {
  const payload = await getPayloadClient()

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const routineId = req.nextUrl.searchParams.get('routineId')

  if (!routineId) {
    return NextResponse.json({ error: 'routineId is required' }, { status: 400 })
  }

  const result = await loadWorkoutFromPayload(payload, { routineId, userId: String(user.id) })

  if (result.status !== 200) {
    return NextResponse.json(result.body, { status: result.status })
  }

  return NextResponse.json(result.body, { status: result.status, headers: result.headers })
}
