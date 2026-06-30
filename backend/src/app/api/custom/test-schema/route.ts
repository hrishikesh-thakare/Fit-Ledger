import { getPayloadClient } from '@/lib/payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayloadClient()
  const table = payload.db.tables['workout_sets']
  // Drizzle tables have properties for each column.
  const columns = Object.keys(table)
  
  return NextResponse.json({ columns })
}
