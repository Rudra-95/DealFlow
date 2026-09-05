import { apiClient } from './client'

export const productsApi = {
  list: () => apiClient.get<unknown[]>('/api/products'),
  get: (id: string) => apiClient.get<unknown>(`/api/products/${id}`),
  create: (payload: unknown) => apiClient.post<unknown>('/api/products', payload),
  update: (id: string, payload: unknown) => apiClient.put<unknown>(`/api/products/${id}`, payload),
}