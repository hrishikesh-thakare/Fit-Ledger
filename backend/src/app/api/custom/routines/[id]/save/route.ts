import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { saveRoutineToPayload } from '@/lib/api-logic/routines/save'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient()
  const { id } = await params

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await req.json()
    const start = performance.now()
    const result = await saveRoutineToPayload(payload, { id, user }, data)
    console.log(`[API] /api/custom/routines/${id}/save took ${performance.now() - start}ms`)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error: unknown) {
    const errObj = error instanceof Error ? error : new Error('Internal Server Error')
    console.error('Error saving routine:', errObj)
    if (errObj.message === 'NOT_FOUND_OR_UNAUTHORIZED') {
      return NextResponse.json({ error: 'Routine not found or you do not have permission to edit it' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

