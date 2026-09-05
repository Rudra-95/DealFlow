import { apiClient } from './client'
import type { ApiQuote, QuotationPayload } from './types'

export const quotationsApi = {
  list: () => apiClient.get<ApiQuote[]>('/api/quotations'),
  get: (id: string) => apiClient.get<ApiQuote>(`/api/quotations/${id}`),
  create: (payload: QuotationPayload) => apiClient.post<ApiQuote>('/api/quotations', payload),
  update: (id: string, payload: Partial<QuotationPayload>) => apiClient.put<ApiQuote>(`/api/quotations/${id}`, payload),
  submit: (id: string) => apiClient.post<ApiQuote>(`/api/quotations/${id}/submit`),
}