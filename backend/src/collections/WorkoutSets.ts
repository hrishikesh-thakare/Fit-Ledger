import type { CollectionConfig } from 'payload'

export const WorkoutSets: CollectionConfig = {
  slug: 'workout-sets',

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return {
        'workoutExercise.workoutDay.user': { equals: req.user.id },
      }
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return {
        'workoutExercise.workoutDay.user': { equals: req.user.id },
      }
    },
    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return {
        'workoutExercise.workoutDay.user': { equals: req.user.id },
      }
    },
  },

  indexes: [
    {
      fields: ['workoutExercise', 'createdAt'],
    },
  ],

  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Only run on CREATE
        if (operation !== 'create') return data

        // Safety checks
        if (!req.user) return data
        if (!data.workoutExercise) return data

        if (
          (data.previousWeight !== undefined && data.previousWeight !== null) ||
          (data.previousReps !== undefined && data.previousReps !== null)
        ) {
          // If provided, trust it and skip lookup
          return data
        }

        // Step 1: Get the workoutExercise with relations
        const workoutExercise = await req.payload.findByID({
          collection: 'workout-exercises',
          id: data.workoutExercise,
          depth: 2, // we need workoutDay + exercise
        })

        const workoutDay = workoutExercise.workoutDay
        const exercise = workoutExercise.exercise

        if (!workoutDay || !exercise) return data
        if (typeof workoutDay === 'number' || typeof exercise === 'number') return data

        // Step 2: Find the most recent WorkoutDay where this exercise was performed
        const mostRecentWorkoutResult = await req.payload.find({
          collection: 'workout-sets',
          where: {
            and: [
              {
                'workoutExercise.exercise': {
                  equals: typeof exercise === 'number' ? exercise : exercise.id,
                },
              },
              {
                'workoutExercise.workoutDay.user': {
                  equals:
                    typeof workoutDay.user === 'number' ? workoutDay.user : workoutDay.user.id,
                },
              },
              {
                'workoutExercise.workoutDay.date': {
                  less_than: workoutDay.date,
                },
              },
            ],
          },
          sort: '-createdAt',
          limit: 1,
          depth: 1, // need workoutDay ID
        })

        if (!mostRecentWorkoutResult.docs.length) return data

        const mostRecentSet = mostRecentWorkoutResult.docs[0]
        let targetWorkoutDayId: string | number
        if (mostRecentSet.workoutDay && typeof mostRecentSet.workoutDay === 'object' && 'id' in mostRecentSet.workoutDay) {
          targetWorkoutDayId = mostRecentSet.workoutDay.id
        } else {
          targetWorkoutDayId = mostRecentSet.workoutDay as string | number
        }

        // Step 3: Find the specific set by setOrder on that previous day
        const previousSets = await req.payload.find({
          collection: 'workout-sets',
          where: {
            and: [
              { 'workoutExercise.exercise': { equals: typeof exercise === 'number' ? exercise : exercise.id } },
              { 'workoutDay': { equals: targetWorkoutDayId } },
              { 'setOrder': { equals: data.setOrder } }
            ]
          },
          limit: 1,
          depth: 0
        })

        const previousSet = previousSets.docs[0]

        if (!previousSet) return data

        // Step 3: Auto-fill previous values
        return {
          ...data,
          previousWeight: previousSet.weight ?? null,
          previousReps: previousSet.reps ?? null,
        }
      },
    ],
  },

  admin: {
    useAsTitle: 'setLabel',
    defaultColumns: ['workoutDay', 'exercise', 'setOrder', 'setLabel', 'reps', 'weight'],
    hidden: true,
  },
  fields: [
    {
      name: 'workoutDay',
      type: 'relationship',
      relationTo: 'workout-days',
      required: true,
      index: true,
    },
    {
      name: 'workoutExercise',
      type: 'relationship',
      relationTo: 'workout-exercises',
      required: true,
      index: true,
    },
    {
      name: 'setOrder',
      type: 'number',
      required: true,
    },
    {
      name: 'setLabel',
      type: 'select',
      required: true,
      options: [
        { label: 'Warmup', value: 'warmup' },
        { label: 'Working Set', value: 'working' },
        { label: 'Drop Set', value: 'drop' },
      ],
    },
    {
      name: 'reps',
      type: 'number',
      required: true,
    },
    {
      name: 'weight',
      type: 'number',
      required: true,
    },
    {
      name: 'previousWeight',
      type: 'number',
    },
    {
      name: 'previousReps',
      type: 'number',
    },
  ],
}
