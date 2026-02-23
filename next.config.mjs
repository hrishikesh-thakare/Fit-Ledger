import { withPayload } from '@payloadcms/next/withPayload'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
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
