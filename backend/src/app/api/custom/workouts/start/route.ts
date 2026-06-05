import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { saveWorkoutToPayload } from '@/lib/api-logic/workouts/start'

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()
  const body = await req.json()

  try {
    const result = await saveWorkoutToPayload(payload, body)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Error saving workout data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
