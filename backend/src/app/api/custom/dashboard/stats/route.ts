import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: req.headers })
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate dates
    const currentNow = new Date()
    const currentY = currentNow.getFullYear()
    const currentM = currentNow.getMonth()

    const startOfCurrentMonth = new Date(currentY, currentM, 1)
    const startOfPreviousMonth = new Date(currentM === 0 ? currentY - 1 : currentY, currentM === 0 ? 11 : currentM - 1, 1)
    const endOfPreviousMonth = new Date(currentY, currentM, 0, 23, 59, 59, 999)

    const cutoff30Days = new Date(); cutoff30Days.setDate(cutoff30Days.getDate() - 30)
    const cutoff3Months = new Date(); cutoff3Months.setMonth(cutoff3Months.getMonth() - 3)
    const cutoffYear = new Date(); cutoffYear.setFullYear(cutoffYear.getFullYear() - 1)

    const startOfCurStr = startOfCurrentMonth.toISOString()
    const startOfPrevStr = startOfPreviousMonth.toISOString()
    const endOfPrevStr = endOfPreviousMonth.toISOString()
    
    const cutoff30DaysStr = cutoff30Days.toISOString()
    const cutoff3MonthsStr = cutoff3Months.toISOString()
    const cutoffYearStr = cutoffYear.toISOString()

    const db = payload.db.drizzle

    import('fs').then(fs => {
      fs.writeFileSync('d:/Gym-App/Fit-Ledger/schema.json', JSON.stringify({
        workout_sets: Object.keys(payload.db.tables['workout_sets']),
        workout_exercises: Object.keys(payload.db.tables['workout_exercises'])
      }, null, 2))
    }).catch(console.error)

    // Query 1: Total sets for current and previous month
    // @ts-expect-error - mismatch between workspace and payload drizzle-orm versions
    const setsResult = await db.execute(sql`
      SELECT 
        COUNT(ws.id) FILTER (WHERE wd.date >= ${startOfCurStr}) AS cur_sets,
        COUNT(ws.id) FILTER (WHERE wd.date >= ${startOfPrevStr} AND wd.date <= ${endOfPrevStr}) AS prev_sets
      FROM workout_sets ws
      JOIN workout_days wd ON ws.workout_day_id = wd.id
      WHERE wd.user_id = ${user.id}
    `)

    const counts = setsResult.rows[0] || { cur_sets: 0, prev_sets: 0 }

    // Query 2: Muscle group sets grouped by muscle group name for all time filters
    // @ts-expect-error - mismatch between workspace and payload drizzle-orm versions
    const muscleResult = await db.execute(sql`
      SELECT 
        mg.name AS muscle_group,
        COUNT(ws.id) FILTER (WHERE wd.date >= ${cutoff30DaysStr}) AS set_count_30_days,
        COUNT(ws.id) FILTER (WHERE wd.date >= ${cutoff3MonthsStr}) AS set_count_3_months,
        COUNT(ws.id) FILTER (WHERE wd.date >= ${cutoffYearStr}) AS set_count_year,
        COUNT(ws.id) AS set_count_all_time
      FROM workout_sets ws
      JOIN workout_days wd ON ws.workout_day_id = wd.id
      JOIN workout_exercises we ON ws.workout_exercise_id = we.id
      JOIN exercises e ON we.exercise_id = e.id
      JOIN muscle_groups mg ON e.muscle_group_id = mg.id
      WHERE wd.user_id = ${user.id}
      GROUP BY mg.name
    `)

    const rawMuscleSets = muscleResult.rows

    // Map the returned rows to the six fixed categories for each time filter
    const muscleSets = {
      '30_days': { back: 0, chest: 0, core: 0, shoulders: 0, arms: 0, legs: 0 },
      '3_months': { back: 0, chest: 0, core: 0, shoulders: 0, arms: 0, legs: 0 },
      'year': { back: 0, chest: 0, core: 0, shoulders: 0, arms: 0, legs: 0 },
      'all_time': { back: 0, chest: 0, core: 0, shoulders: 0, arms: 0, legs: 0 }
    }

    rawMuscleSets.forEach((row: Record<string, unknown>) => {
      const m = (typeof row.muscle_group === 'string' ? row.muscle_group : '').toLowerCase()
      
      const countsForTime = {
        '30_days': Number(row.set_count_30_days) || 0,
        '3_months': Number(row.set_count_3_months) || 0,
        'year': Number(row.set_count_year) || 0,
        'all_time': Number(row.set_count_all_time) || 0,
      }

      for (const timeKey of Object.keys(countsForTime) as (keyof typeof muscleSets)[]) {
        const count = countsForTime[timeKey]
        
        if (m.includes('back')) muscleSets[timeKey].back += count
        else if (m.includes('chest')) muscleSets[timeKey].chest += count
        else if (m.includes('core') || m.includes('abs') || m.includes('waist')) muscleSets[timeKey].core += count
        else if (m.includes('shoulder') || m.includes('delts')) muscleSets[timeKey].shoulders += count
        else if (m.includes('arm') || m.includes('bicep') || m.includes('tricep') || m.includes('forearm')) muscleSets[timeKey].arms += count
        else if (m.includes('leg') || m.includes('quad') || m.includes('hamstring') || m.includes('calf') || m.includes('glute')) muscleSets[timeKey].legs += count
      }
    })

    return NextResponse.json({
      curSets: Number(counts.cur_sets) || 0,
      prevSets: Number(counts.prev_sets) || 0,
      muscleSets
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
