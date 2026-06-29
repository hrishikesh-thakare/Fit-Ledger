import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',

  access: {
    create: () => true,
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
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days in seconds
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes in ms
  },
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
      access: {
        read: () => true,
        update: ({ req }) => req.user?.role === 'admin',
      },
      hooks: {
        beforeChange: [
          async ({ req, value }) => {
            // Only admins can set or change roles
            if (req.user?.role === 'admin') {
              return value
            }
            
            // Allow the very first user created in the database to be an admin (Payload onboarding flow)
            if (!req.user) {
              const { totalDocs } = await req.payload.find({
                collection: 'users',
                limit: 1,
                depth: 0,
              })
              if (totalDocs === 0) {
                return value
              }
            }
            
            // Everyone else is forced to be a user
            return 'user'
          },
        ],
      },
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
