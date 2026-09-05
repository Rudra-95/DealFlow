import { apiClient } from './client'

export const subscriptionsApi = {
  list: () => apiClient.get<unknown[]>('/api/subscriptions'),
  get: (id: string) => apiClient.get<unknown>(`/api/subscriptions/${id}`),
  update: (id: string, payload: unknown) => apiClient.put<unknown>(`/api/subscriptions/${id}`, payload),
}