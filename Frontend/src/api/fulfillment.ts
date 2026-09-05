import { apiClient } from './client'
import type { ManualSplitPayload } from './types'

export const fulfillmentApi = {
  list: () => apiClient.get<unknown[]>('/api/fulfillment'),
  get: (id: string) => apiClient.get<unknown>(`/api/fulfillment/${id}`),
  acceptSplit: (id: string) => apiClient.post<unknown>(`/api/fulfillment/${id}/accept-split`),
  manualSplit: (id: string, payload: ManualSplitPayload) => apiClient.post<unknown>(`/api/fulfillment/${id}/manual-split`, payload),
}