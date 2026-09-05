import { apiClient } from './client'
import type { NegotiationPayload } from './types'

export const negotiationApi = {
  getQuotation: () => apiClient.get<unknown>('/api/customer/quotation'),
  negotiate: (payload: NegotiationPayload) => apiClient.post<unknown>('/api/customer/quotation/negotiate', payload),
  confirm: () => apiClient.post<unknown>('/api/customer/quotation/confirm'),
}