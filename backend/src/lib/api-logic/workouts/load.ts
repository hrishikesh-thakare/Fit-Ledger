import type { Payload } from 'payload'

interface RoutineSetLike {
  routineExercise?: string | number | { id: string | number }
  setOrder: number
  setLabel: string
  weight: number
  reps: number
}

interface WorkoutLoadResult {
  title: string
  date: string
  exercises: Array<{
    id: string
    exerciseId: string
    name: string
    equipment?: string
    restTime: number
    sets: Array<{
      id: string
      type: 'N' | 'W' | 'D'
      weight: string
      reps: string
      completed: boolean
      previous: string
      setOrder: number
      setLabel?: string
    }>
    order: number
  }>
}

type WorkoutSetType = 'N' | 'W' | 'D'

export async function loadWorkoutFromPayload(
  payload: Payload,
  params: { routineId: string | number; userId?: string | number },
): Promise<{ status: number; body: WorkoutLoadResult | { error: string }; headers?: Record<string, string> }> {
  const { routineId, userId } = params
  const date = new Date().toISOString()
  const numericRoutineId = Number(routineId)

  if (!routineId) {
    return { status: 400, body: { error: 'routineId is required' } }
  }

  const [routine, routineExercisesResponse] = await Promise.all([
    payload.findByID({ collection: 'routines', id: numericRoutineId, overrideAccess: true }),
    payload.find({
      collection: 'routine-exercises',
      where: { routine: { equals: numericRoutineId } },
      sort: 'exerciseOrder',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    }),
  ])

  if (!routine) {
    return { status: 404, body: { error: 'Routine not found' } }
  }

  const routineUserId = typeof routine.user === 'object' ? routine.user.id : routine.user
  if (String(routineUserId) !== String(userId)) {
    return { status: 403, body: { error: 'Forbidden' } }
  }

  const routineExerciseIds = routineExercisesResponse.docs.map((re) => re.id)
  const resolvedUserId = userId
    ? Number(userId)
    : typeof routine.user === 'object'
      ? routine.user.id
      : routine.user

  const exerciseIds = routineExercisesResponse.docs
    .map((re) => (typeof re.exercise === 'object' ? re.exercise.id : re.exercise))
    .filter((id) => typeof id === 'number' || typeof id === 'string')

  const [routineSetsResponse, previousStatsMap] = await Promise.all([
    routineExerciseIds.length > 0
      ? payload.find({
          collection: 'routine-sets',
          where: { routineExercise: { in: routineExerciseIds } },
          limit: 1000,
          sort: 'setOrder',
          depth: 0,
          overrideAccess: true,
        })
      : Promise.resolve({ docs: [] as RoutineSetLike[] }),
    (async () => {
      if (exerciseIds.length === 0) return new Map<string, { weight: number; reps: number }>()

      const recentSetsResult = await payload.find({
        collection: 'workout-sets',
        where: {
          and: [
            { 'workoutExercise.exercise': { in: exerciseIds } },
            { 'workoutDay.user': { equals: resolvedUserId } },
            { 'workoutDay.date': { less_than: date } },
          ],
        },
        sort: '-createdAt',
        limit: 1000,
        depth: 1,
        overrideAccess: true,
      })

      // Find the most recent workoutDay ID for each exercise
      const mostRecentDayIdPerEx = new Map<string, string | number>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentSetsResult.docs.forEach((setRaw: any) => {
        const set = setRaw
        const exId = typeof set.workoutExercise.exercise === 'object' ? set.workoutExercise.exercise.id : set.workoutExercise.exercise
        const exIdStr = String(exId)
        
        if (!mostRecentDayIdPerEx.has(exIdStr)) {
          const dayId = typeof set.workoutDay === 'object' && set.workoutDay ? set.workoutDay.id : set.workoutDay
          if (dayId) mostRecentDayIdPerEx.set(exIdStr, dayId)
        }
      })

      // Now populate stats Map only for the sets belonging to that most recent day
      const statsMap = new Map<string, { weight: number; reps: number }>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentSetsResult.docs.forEach((setRaw: any) => {
        const set = setRaw
        const exId = typeof set.workoutExercise.exercise === 'object' ? set.workoutExercise.exercise.id : set.workoutExercise.exercise
        const exIdStr = String(exId)
        const dayId = typeof set.workoutDay === 'object' && set.workoutDay ? set.workoutDay.id : set.workoutDay
        
        if (mostRecentDayIdPerEx.get(exIdStr) === dayId) {
          statsMap.set(`${exIdStr}:${set.setOrder}`, { weight: set.weight, reps: set.reps })
        }
      })
      return statsMap
    })(),
  ])

  const allRoutineSets = routineSetsResponse.docs as RoutineSetLike[]

  const exercises = routineExercisesResponse.docs.map((re, i) => {
    const exerciseId = typeof re.exercise === 'object' ? re.exercise.id : re.exercise
    const exerciseIdString = String(exerciseId)

    const relatedSets = allRoutineSets
      .filter((set) => {
        const setReId = typeof set.routineExercise === 'object' ? set.routineExercise.id : set.routineExercise
        return String(setReId) === String(re.id)
      })
      .sort((a, b) => a.setOrder - b.setOrder)

    const setsData = relatedSets.map((routineSet, j) => {
      const prevStats = previousStatsMap.get(`${exerciseIdString}:${j}`)
      return {
        id: `temp-${i}-${j}`,
        type: (routineSet.setLabel === 'warmup' ? 'W' : routineSet.setLabel === 'drop' ? 'D' : 'N') as WorkoutSetType,
        weight: String(routineSet.weight),
        reps: String(routineSet.reps),
        completed: false,
        previous: prevStats ? `${prevStats.weight}x${prevStats.reps}` : '-',
        setOrder: j,
        setLabel: routineSet.setLabel,
      }
    })

    const equipment =
      typeof re.exercise === 'object' && 'equipment' in re.exercise ? re.exercise.equipment ?? undefined : undefined

    return {
      id: `temp-ex-${i}`,
      exerciseId: String(exerciseId),
      name: typeof re.exercise === 'object' ? re.exercise.name : 'Unknown Exercise',
      equipment,
      restTime: 60,
      sets: setsData,
      order: i,
    }
  })

  exercises.sort((a, b) => a.order - b.order)

  return {
    status: 200,
    body: {
      title: routine.name,
      date,
      exercises,
    },
  }
}
