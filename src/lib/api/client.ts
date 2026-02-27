export class APIError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown, message?: string) {
    super(message || `API Error: ${status}`)
    this.status = status
    this.data = data
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>
}

// Helper to handle relative API paths and default headers
const apiFetch = async <T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { params, ...fetchOptions } = options

  // Build URL with query params
  let url = endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, {
    cache: 'no-store', // Prevent aggressive browser GET caching
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
    credentials: 'include', // Important for Payload CMS auth cookies
  })

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new APIError(
      response.status,
      data,
      data.errors?.[0]?.message || data.error || 'An error occurred',
    )
  }

  return data
}

export default apiFetch
