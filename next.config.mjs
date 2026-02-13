import { withPayload } from '@payloadcms/next/withPayload'

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

// Important: devBundleServerPackages must be false
export default withPayload(nextConfig, {
  devBundleServerPackages: false,
})
