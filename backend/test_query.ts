import { getPayload } from 'payload'
import configPromise from './src/payload.config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  
  // Try running a basic query
  try {
    const res = await payload.db.drizzle.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `)
    console.log('Tables:', res.rows.map((r: any) => r.table_name))
  } catch (err) {
    console.error('Error:', err)
  }
  
  process.exit(0)
}

run()
