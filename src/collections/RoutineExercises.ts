import type { CollectionConfig, Where } from 'payload'

export const RoutineExercises: CollectionConfig = {
  slug: 'routine-exercises',

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true

      const where: Where = {
        'routine.user': {
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
        'routine.user': {
          equals: req.user.id,
        },
      }

      return where
    },

    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true

      const where: Where = {
        'routine.user': {
          equals: req.user.id,
        },
      }

      return where
    },
  },

  admin: {
    useAsTitle: 'exercise',
    defaultColumns: ['routine', 'exercise', 'exerciseOrder', 'createdAt'],
    hidden: true,
  },
  fields: [
    {
      name: 'routine',
      type: 'relationship',
      relationTo: 'routines',
      required: true,
      index: true,
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
  ],
}
