import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Payload } from 'payload'

let cached = (global as unknown as { payload: { client: Payload | null; promise: Promise<Payload> | null } }).payload

if (!cached) {
  cached = (global as unknown as { payload: { client: Payload | null; promise: Promise<Payload> | null } }).payload = {
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
