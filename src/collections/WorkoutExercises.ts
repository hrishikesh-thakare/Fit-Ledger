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
