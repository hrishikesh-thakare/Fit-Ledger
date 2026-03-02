import { withPayload } from '@payloadcms/next/withPayload'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  fallbacks: {
    document: '/~offline',
  },
  runtimeCaching: [
    {
      // Cache page navigations — regex matches full URLs like https://domain.com/routines
      urlPattern: /\/(dashboard|routines|bodyweight|history|profile|workout|login|signup)(\/|$|\?)/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'app-pages',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 86400,
        },
      },
    },
    {
      urlPattern: /\/api\/custom\/(routines|exercises)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-data',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 86400,
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling Node-only dependencies
  serverExternalPackages: ['sharp', 'pg', 'pino', 'ws'],

  webpack: (config) => {
    // Required for Payload + TS interop
    config.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return config
  },
}

export default withPayload(withPWA(nextConfig), { devBundleServerPackages: false })
