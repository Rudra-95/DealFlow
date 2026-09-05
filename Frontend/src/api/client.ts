const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = {
  baseUrl: API_BASE_URL,
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('The DealFlow360 service is unavailable.')
    return response.json() as Promise<T>
  },
}

export const serviceMode = API_BASE_URL ? 'Connected API' : 'Demo data'