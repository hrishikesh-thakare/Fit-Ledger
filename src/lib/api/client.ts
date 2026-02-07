export class APIError extends Error {
  status: number
  data: any

  constructor(status: number, data: any, message?: string) {
    super(message || `API Error: ${status}`)
    this.status = status
    this.data = data
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>
}

// Helper to handle relative API paths and default headers
const apiFetch = async <T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
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
    throw new APIError(response.status, data, data.errors?.[0]?.message || 'An error occurred')
  }

  return data
}

export default apiFetch
