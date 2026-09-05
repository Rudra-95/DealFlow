import { apiClient } from './client'

export const reportsApi = {
  get: (query = '') => apiClient.get<unknown>(`/api/reports${query ? `?${query}` : ''}`),
}