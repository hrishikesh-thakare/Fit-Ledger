import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { saveWorkoutToPayload } from '@/lib/api-logic/workouts/start'

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  try {
    const result = await saveWorkoutToPayload(payload, body, user.id)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error: unknown) {
    console.error('Error saving workout data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
