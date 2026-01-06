import type { CollectionConfig } from 'payload'

export const Exercises: CollectionConfig = {
  slug: 'exercises',

  access: {
    read: () => true, // anyone logged in (or even public if you allow)
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
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
    },
    {
      name: 'muscleGroup',
      type: 'relationship',
      relationTo: 'muscle-groups',
      required: true,
    },
    {
      name: 'isCustom',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
