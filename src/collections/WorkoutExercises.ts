import type { CollectionConfig, Where } from 'payload'

export const WorkoutExercises: CollectionConfig = {
  slug: 'workout-exercises',

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true

      const where: Where = {
        'workoutDay.user': {
          equals: req.user.id,
        },
      }

      return where
    },

    create: ({ req }) => !!req.user,

    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true

      const where: Where = {
        'workoutDay.user': {
          equals: req.user.id,
        },
      }

      return where
    },

    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true

      const where: Where = {
        'workoutDay.user': {
          equals: req.user.id,
        },
      }

      return where
    },
  },

  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // On create, verify the workout day belongs to the current user
        if (operation === 'create' && data.workoutDay && req.user) {
          const workoutDay = await req.payload.findByID({
            collection: 'workout-days',
            id: data.workoutDay,
          })
          
          // Check if workout day belongs to current user
          const userId = typeof workoutDay.user === 'object' ? workoutDay.user.id : workoutDay.user
          if (userId !== req.user.id && req.user.role !== 'admin') {
            throw new Error('You can only add exercises to your own workout days')
          }
        }
        return data
      },
    ],
  },

  admin: {
    useAsTitle: 'exercise',
    defaultColumns: ['workoutDay', 'exercise', 'exerciseOrder', 'createdAt'],
    hidden: true,
  },
  fields: [
    {
      name: 'workoutDay',
      type: 'relationship',
      relationTo: 'workout-days',
      required: true,
    },
    {
      name: 'exercise',
      type: 'relationship',
      relationTo: 'exercises',
      required: true,
    },
    {
      name: 'exerciseOrder',
      type: 'number',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
