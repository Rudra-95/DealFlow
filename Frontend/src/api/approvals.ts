import { apiClient } from './client'
import type { ApiQuote, ApprovalDecisionPayload } from './types'

export const approvalsApi = {
  list: () => apiClient.get<ApiQuote[]>('/api/approvals'),
  get: (id: string) => apiClient.get<ApiQuote>(`/api/approvals/${id}`),
  approve: (id: string, payload?: ApprovalDecisionPayload) => apiClient.post<ApiQuote>(`/api/approvals/${id}/approve`, payload),
  reject: (id: string, payload?: ApprovalDecisionPayload) => apiClient.post<ApiQuote>(`/api/approvals/${id}/reject`, payload),
  returnForRevision: (id: string, payload?: ApprovalDecisionPayload) => apiClient.post<ApiQuote>(`/api/approvals/${id}/return`, payload),
}