import type { CollectionConfig } from 'payload'

export const WorkoutDays: CollectionConfig = {
  slug: 'workout-days',

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { user: { equals: req.user.id } }
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { user: { equals: req.user.id } }
    },
    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { user: { equals: req.user.id } }
    },
  },

  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        // Auto-fill user field on create
        if (operation === 'create' && req.user) {
          data.user = req.user.id
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        // Delete all related workout exercises and sets when a workout day is deleted
        try {
          // Find all workout exercises for this workout day
          const workoutExercises = await req.payload.find({
            collection: 'workout-exercises',
            where: {
              workoutDay: {
                equals: id,
              },
            },
            limit: 1000,
          })

          // Delete all workout sets for each exercise
          for (const exercise of workoutExercises.docs) {
            await req.payload.delete({
              collection: 'workout-sets',
              where: {
                workoutExercise: {
                  equals: exercise.id,
                },
              },
            })
          }

          // Delete all workout exercises for this workout day
          await req.payload.delete({
            collection: 'workout-exercises',
            where: {
              workoutDay: {
                equals: id,
              },
            },
          })
        } catch (error) {
          console.error('Error in beforeDelete hook for workout-days:', error)
          throw error
        }
      },
    ],
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'date', 'createdAt'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'durationSeconds',
      type: 'number',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
