import type { CollectionConfig } from 'payload'

export const WorkoutSets: CollectionConfig = {
  slug: 'workout-sets',

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return {
        'workoutDay.user': { equals: req.user.id },
      }
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return {
        'workoutDay.user': { equals: req.user.id },
      }
    },
    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return {
        'workoutDay.user': { equals: req.user.id },
      }
    },
  },

  indexes: [
    {
      fields: ['workoutExercise', 'createdAt'],
    },
  ],

  hooks: {},

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
    {
      name: 'displayLabel',
      type: 'text',
    },
  ],
}
