import { apiClient } from './client'
import type { InvoiceDetailData, PaymentPayload } from './types'

export const invoicesApi = {
  list: () => apiClient.get<unknown[]>('/api/invoices'),
  get: (id: string) => apiClient.get<InvoiceDetailData | unknown>(`/api/invoices/${id}`),
  recordPayment: (id: string, payload: PaymentPayload) => apiClient.post<InvoiceDetailData | unknown>(`/api/invoices/${id}/payment`, payload),
}