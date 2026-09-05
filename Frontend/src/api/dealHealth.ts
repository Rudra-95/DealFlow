import { apiClient } from './client'

export const dealHealthApi = {
  list: () => apiClient.get<unknown[]>('/api/deal-health'),
  nudge: (id: string) => apiClient.post<unknown>(`/api/deal-health/${id}/nudge`),
  escalate: (id: string) => apiClient.post<unknown>(`/api/deal-health/${id}/escalate`),
}