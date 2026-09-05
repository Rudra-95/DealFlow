const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) throw new Error('The DealFlow360 service is unavailable.')
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const apiClient = {
  baseUrl: API_BASE_URL,
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
}

export const serviceMode = API_BASE_URL ? 'Connected API' : 'Demo data'