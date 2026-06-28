import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { MuscleGroups } from './collections/MuscleGroups'
import { Exercises } from './collections/Exercises'
import { Routines } from './collections/Routines'
import { RoutineExercises } from './collections/RoutineExercises'
import { RoutineSets } from './collections/RoutineSets'
import { WorkoutDays } from './collections/WorkoutDays'
import { WorkoutSets } from './collections/WorkoutSets'
import { WorkoutExercises } from './collections/WorkoutExercises'
import { BodyWeightLogs } from './collections/BodyWeightLogs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const secret = process.env.PAYLOAD_SECRET
if (!secret) throw new Error('PAYLOAD_SECRET env var is required')

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error('DATABASE_URL env var is required')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  cors: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://10.0.2.2:3000',
    'http://10.0.2.2:8081',
  ],
  csrf: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://10.0.2.2:3000',
    'http://10.0.2.2:8081',
  ],
  collections: [
    Users,
    Media,
    MuscleGroups,
    Exercises,
    Routines,
    RoutineExercises,
    RoutineSets,
    WorkoutDays,
    WorkoutExercises,
    WorkoutSets,
    BodyWeightLogs,
  ],
  editor: lexicalEditor(),
  secret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: dbUrl,
    },
  }),
  sharp,
  plugins: [],
})
