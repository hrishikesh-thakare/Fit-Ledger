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
        // Delete related routine-exercises and their sets in bulk (3 DB calls instead of N+1)
        try {
          // 1. Find all routine exercises
          const routineExercises = await req.payload.find({
            collection: 'routine-exercises',
            where: {
              routine: {
                equals: id,
              },
            },
            limit: 1000,
            depth: 0,
          })

          const exerciseIds = routineExercises.docs.map((ex) => ex.id)

          if (exerciseIds.length > 0) {
            // 2. Bulk delete sets
            await req.payload.delete({
              collection: 'routine-sets',
              where: {
                routineExercise: {
                  in: exerciseIds,
                },
              },
            })

            // 3. Bulk delete exercises
            await req.payload.delete({
              collection: 'routine-exercises',
              where: {
                id: {
                  in: exerciseIds,
                },
              },
            })
          }
        } catch (error) {
          console.error('Error in beforeDelete hook for routines:', error)
          throw error
        }
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
