import type { Payload } from 'payload'

export async function listRoutinesFromPayload(
  payload: Payload,
  userId: string | number,
): Promise<{ status: number; body: unknown; headers?: Record<string, string> }> {
  const numericUserId = Number(userId)

  if (!userId || Number.isNaN(numericUserId)) {
    return { status: 400, body: { errors: [{ message: 'Invalid User ID' }] } }
  }

  const routinesRes = await payload.find({
    collection: 'routines',
    where: {
      user: { equals: numericUserId },
      isActive: { equals: 'active' },
    },
    sort: '-createdAt',
    depth: 0,
    limit: 100,
    select: {
      id: true,
      name: true,
      notes: true,
      exerciseCount: true,
      setCount: true,
    },
  })

  const routines = routinesRes.docs
  const routineIds = routines.map((r) => r.id)

  if (routineIds.length === 0) {
    return { status: 200, body: { docs: [] } }
  }

  const routineExercisesRes = await payload.find({
    collection: 'routine-exercises',
    where: {
      routine: { in: routineIds },
    },
    depth: 0,
    limit: 500,
    select: {
      routine: true,
      exercise: true,
      exerciseOrder: true,
    },
    sort: 'exerciseOrder',
  })

  const routineExercises = routineExercisesRes.docs
  const exerciseIds = [
    ...new Set(
      routineExercises.map((rx) =>
        typeof rx.exercise === 'object' ? rx.exercise.id : rx.exercise,
      ),
    ),
  ]

  const exercisesRes =
    exerciseIds.length > 0
      ? await payload.find({
          collection: 'exercises',
          where: {
            id: { in: exerciseIds },
          },
          depth: 1,
          limit: 500,
          select: {
            id: true,
            name: true,
            muscleGroup: true,
          },
        })
      : { docs: [] }

  const exercises = exercisesRes.docs
  const exerciseMap = new Map<number, { id: number; name: string; muscleGroup?: { name: string } | number }>()
  exercises.forEach((ex) => {
    exerciseMap.set(ex.id, ex)
  })

  const exercisesByRoutine: Record<number, typeof routineExercises[number][]> = {}
  routineExercises.forEach((rx) => {
    const routineId = typeof rx.routine === 'object' ? rx.routine.id : rx.routine
    if (!exercisesByRoutine[routineId]) {
      exercisesByRoutine[routineId] = []
    }
    exercisesByRoutine[routineId].push(rx)
  })

  const formatDuration = (totalSets: number): string => {
    if (!totalSets) return '~0m'
    const minutes = Math.round(totalSets * 3)
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs}h`
    }
    return `~${minutes}m`
  }

  const results = routines.map((routine) => {
    const rxList = exercisesByRoutine[routine.id] || []
    const muscleGroups = new Set<string>()
    const previewExercises: string[] = []

    rxList.forEach((rx) => {
      const exerciseId = typeof rx.exercise === 'object' ? rx.exercise.id : rx.exercise
      const exercise = exerciseMap.get(exerciseId)
      if (!exercise) return
      if (previewExercises.length < 3) previewExercises.push(exercise.name)
      if (exercise.muscleGroup && typeof exercise.muscleGroup === 'object') {
        muscleGroups.add(exercise.muscleGroup.name)
      }
    })

    return {
      id: routine.id,
      name: routine.name,
      description: routine.notes || '',
      exerciseCount: routine.exerciseCount || 0,
      duration: formatDuration(routine.setCount || 0),
      previewExercises,
      muscleGroups: Array.from(muscleGroups),
    }
  })

  return { status: 200, body: { docs: results } }
}
