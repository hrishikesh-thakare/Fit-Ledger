import { getPayloadClient } from '../src/lib/payload'

async function clearExercises() {
  const payload = await getPayloadClient()

  console.log('🔄 Deleting routine-sets...')
  const routineSets = await payload.find({ collection: 'routine-sets', limit: 10000 })
  for (const doc of routineSets.docs) {
    await payload.delete({ collection: 'routine-sets', id: doc.id })
  }
  console.log(`  ✅ Deleted ${routineSets.docs.length} routine-sets`)

  console.log('🔄 Deleting routine-exercises...')
  const routineExercises = await payload.find({ collection: 'routine-exercises', limit: 10000 })
  for (const doc of routineExercises.docs) {
    await payload.delete({ collection: 'routine-exercises', id: doc.id })
  }
  console.log(`  ✅ Deleted ${routineExercises.docs.length} routine-exercises`)

  console.log('🔄 Deleting workout-sets...')
  const workoutSets = await payload.find({ collection: 'workout-sets', limit: 10000 })
  for (const doc of workoutSets.docs) {
    await payload.delete({ collection: 'workout-sets', id: doc.id })
  }
  console.log(`  ✅ Deleted ${workoutSets.docs.length} workout-sets`)

  console.log('🔄 Deleting workout-exercises...')
  const workoutExercises = await payload.find({ collection: 'workout-exercises', limit: 10000 })
  for (const doc of workoutExercises.docs) {
    await payload.delete({ collection: 'workout-exercises', id: doc.id })
  }
  console.log(`  ✅ Deleted ${workoutExercises.docs.length} workout-exercises`)

  console.log('🔄 Deleting workout-days...')
  const workoutDays = await payload.find({ collection: 'workout-days', limit: 10000 })
  for (const doc of workoutDays.docs) {
    await payload.delete({ collection: 'workout-days', id: doc.id })
  }
  console.log(`  ✅ Deleted ${workoutDays.docs.length} workout-days`)

  console.log('🔄 Deleting routines...')
  const routines = await payload.find({ collection: 'routines', limit: 10000 })
  for (const doc of routines.docs) {
    await payload.delete({ collection: 'routines', id: doc.id })
  }
  console.log(`  ✅ Deleted ${routines.docs.length} routines`)

  console.log('🔄 Deleting exercises...')
  const exercises = await payload.find({ collection: 'exercises', limit: 10000 })
  for (const doc of exercises.docs) {
    await payload.delete({ collection: 'exercises', id: doc.id })
  }
  console.log(`  ✅ Deleted ${exercises.docs.length} exercises`)

  console.log('\n🎉 All exercises and related records cleared!')
  process.exit(0)
}

clearExercises().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
