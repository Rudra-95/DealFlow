import { apiClient } from './client'
import type { DiscountRules } from './types'

export const adminApi = {
  getDiscountRules: () => apiClient.get<DiscountRules>('/api/admin/discount-rules'),
  updateDiscountRules: (payload: DiscountRules) => apiClient.put<DiscountRules>('/api/admin/discount-rules', payload),
}