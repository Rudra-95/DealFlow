import { apiClient } from './client'
import type { SubscriptionDetailData } from './types'

export const subscriptionsApi = {
  list: () => apiClient.get<unknown[]>('/api/subscriptions'),
  get: (id: string) => apiClient.get<SubscriptionDetailData | unknown>(`/api/subscriptions/${id}`),
  update: (id: string, payload: unknown) => apiClient.put<SubscriptionDetailData | unknown>(`/api/subscriptions/${id}`, payload),
}