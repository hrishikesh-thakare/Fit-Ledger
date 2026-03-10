import { withPayload } from '@payloadcms/next/withPayload'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  importScripts: ['/custom-sw.js'],
  fallbacks: {
    document: '/~offline',
  },
  runtimeCaching: [
    // API data
    {
      urlPattern: /\/api\/custom\/(routines|exercises)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-data',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 172800, // 2 days
        },
      },
    },
    // Pages (non-API, same-origin)
    {
      urlPattern: ({ url, sameOrigin }) => sameOrigin && !url.pathname.startsWith('/api/'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 86400,
        },
      },
    },
    // RSC responses
    {
      urlPattern: ({ request, sameOrigin }) =>
        request.headers.get('RSC') === '1' && sameOrigin,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-rsc',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 32,
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
