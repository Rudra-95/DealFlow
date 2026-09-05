import { apiClient } from './client'
import type { ReportsData } from './types'

export const reportsApi = {
  get: (query = '') => apiClient.get<ReportsData | unknown>(`/api/reports${query ? `?${query}` : ''}`),
}