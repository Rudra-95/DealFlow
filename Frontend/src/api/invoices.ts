import { apiClient } from './client'
import type { PaymentPayload } from './types'

export const invoicesApi = {
  list: () => apiClient.get<unknown[]>('/api/invoices'),
  get: (id: string) => apiClient.get<unknown>(`/api/invoices/${id}`),
  recordPayment: (id: string, payload: PaymentPayload) => apiClient.post<unknown>(`/api/invoices/${id}/payment`, payload),
}