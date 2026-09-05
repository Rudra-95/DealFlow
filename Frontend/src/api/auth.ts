import { apiClient } from './client'

export const authApi = {
  me: () => apiClient.get<unknown>('/api/me'),
}