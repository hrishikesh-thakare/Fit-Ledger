import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return {
        id: {
          equals: req.user.id,
        },
      }
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return {
        id: {
          equals: req.user.id,
        },
      }
    },
  },

  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'preferredUnit',
      type: 'select',
      options: [
        { label: 'Kilograms (kg)', value: 'kg' },
        { label: 'Pounds (lb)', value: 'lb' },
      ],
      defaultValue: 'kg',
      required: true,
    },
    {
      name: 'targetWeight',
      type: 'number',
      admin: {
        description: 'Your target body weight goal',
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: 'user',
      required: true,
    },
    {
      name: 'isActive',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ],
}
