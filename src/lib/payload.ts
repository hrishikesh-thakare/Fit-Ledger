import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Payload } from 'payload'

interface GlobalPayload {
  payload: {
    client: Payload | null
    promise: Promise<Payload> | null
  }
}

let cached = (global as unknown as GlobalPayload).payload

if (!cached) {
  cached = (global as unknown as GlobalPayload).payload = {
    client: null,
    promise: null,
  }
}

export const getPayloadClient = async (): Promise<Payload> => {
  if (cached.client) {
    return cached.client
  }

  if (!cached.promise) {
    cached.promise = getPayload({
      config: configPromise,
    })
  }

  try {
    cached.client = await cached.promise
  } catch (e: unknown) {
    cached.promise = null
    throw e
  }

  return cached.client
}
