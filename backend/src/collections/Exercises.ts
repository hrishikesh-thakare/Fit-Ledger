import type { CollectionConfig, Where } from 'payload'

export const Exercises: CollectionConfig = {
  slug: 'exercises',

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      const query: Where = {
        or: [
          { isCustom: { equals: false } },
          {
            and: [{ isCustom: { equals: true } }, { createdBy: { equals: req.user.id } }],
          },
        ],
      }
      return query
    },
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      const query: Where = {
        and: [{ isCustom: { equals: true } }, { createdBy: { equals: req.user.id } }],
      }
      return query
    },
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'muscleGroup', 'isCustom', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'muscleGroup',
      type: 'relationship',
      relationTo: 'muscle-groups',
      required: true,
    },
    {
      name: 'equipment',
      type: 'select',
      hasMany: false,
      required: false,
      options: [
        { label: 'Barbell', value: 'barbell' },
        { label: 'Dumbbell', value: 'dumbbell' },
        { label: 'Machine', value: 'machine' },
        { label: 'Cable', value: 'cable' },
        { label: 'Smith Machine', value: 'smith_machine' },
        { label: 'Bodyweight', value: 'bodyweight' },
      ],
    },
    {
      name: 'isCustom',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.isCustom),
      },
    },
  ],
}
