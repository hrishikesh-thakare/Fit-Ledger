import type { CollectionConfig, Where } from 'payload'

export const RoutineSets: CollectionConfig = {
  slug: 'routine-sets',

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true

      const where: Where = {
        'routineExercise.routine.user': {
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
        'routineExercise.routine.user': {
          equals: req.user.id,
        },
      }

      return where
    },

    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true

      const where: Where = {
        'routineExercise.routine.user': {
          equals: req.user.id,
        },
      }

      return where
    },
  },

  admin: {
    useAsTitle: 'setLabel',
    defaultColumns: ['routineExercise', 'setOrder', 'setLabel', 'reps', 'weight'],
    hidden: true,
  },
  fields: [
    {
      name: 'routineExercise',
      type: 'relationship',
      relationTo: 'routine-exercises',
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
        { label: 'Failure', value: 'failure' },
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
  ],
}
