const rawBase = import.meta.env.VITE_API_URL || ''
const API_BASE = rawBase ? rawBase.replace(/\/+$/, '') : ''

export class ApiError extends Error {
  status: number
  data: any

  constructor(status: number, message: string, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  let url = API_BASE ? `${API_BASE}${cleanEndpoint}` : cleanEndpoint
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, {
    credentials: 'include', // essential for httpOnly cookie authentication
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...restOptions,
  })

  let responseData: any = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json()
    } catch {
      responseData = null
    }
  }

  if (!response.ok) {
    let errorMessage = responseData?.error || responseData?.message
    if (responseData?.details && typeof responseData.details === 'object') {
      const flatDetails = Object.values(responseData.details).flat()
      if (flatDetails.length > 0 && typeof flatDetails[0] === 'string') {
        errorMessage = flatDetails[0]
      }
    }
    if (!errorMessage) {
      errorMessage = `Request failed with status ${response.status}`
    }
    throw new ApiError(response.status, errorMessage, responseData)
  }

  return responseData as T
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}
