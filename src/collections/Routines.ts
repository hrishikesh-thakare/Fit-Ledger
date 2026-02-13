import type { CollectionConfig } from 'payload'

export const Routines: CollectionConfig = {
  slug: 'routines',

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

  indexes: [
    {
      fields: ['user', 'isActive'],
    },
  ],

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
        // Delete related routine-exercises and their sets before deleting the routine
        const routineExercises = await req.payload.find({
          collection: 'routine-exercises',
          where: {
            routine: {
              equals: id,
            },
          },
        })

        // For each routine-exercise, delete its sets
        for (const routineExercise of routineExercises.docs) {
          await req.payload.delete({
            collection: 'routine-sets',
            where: {
              routineExercise: {
                equals: routineExercise.id,
              },
            },
          })
        }

        // Delete all routine-exercises for this routine
        await req.payload.delete({
          collection: 'routine-exercises',
          where: {
            routine: {
              equals: id,
            },
          },
        })
      },
    ],
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'user', 'isActive', 'createdAt'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'isActive',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      name: 'exerciseCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'setCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
  ],
}
