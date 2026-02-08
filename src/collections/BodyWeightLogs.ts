import type { CollectionConfig } from 'payload'

export const BodyWeightLogs: CollectionConfig = {
  slug: 'body-weight-logs',

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
  },

  admin: {
    useAsTitle: 'weight',
    defaultColumns: ['user', 'weight', 'loggedAt', 'createdAt'],
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
      name: 'weight',
      type: 'number',
      required: true,
    },
    {
      name: 'loggedAt',
      type: 'date',
      required: true,
      index: true,
    },
  ],
}
