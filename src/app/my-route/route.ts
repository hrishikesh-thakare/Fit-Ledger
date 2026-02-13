import { getPayloadClient } from '@/lib/payload'

export const GET = async (_request: Request) => {
  const _payload = await getPayloadClient()

  return Response.json({
    message: 'This is an example of a custom route.',
  })
}
