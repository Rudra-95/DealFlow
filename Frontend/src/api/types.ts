import type { Quote, QuoteLine } from '../data'

export interface DashboardResponse {
  pipelineValue: number
  pendingApprovals: number
  openQuotations: number
  atRiskDeals: number
  revenueTrend: Array<{ month: string; won: number; pipeline: number }>
  recentActivity: Array<{ id: string; title: string; detail: string; time: string; href?: string; tone: string }>
}

export interface QuotationPayload { customerId: string; lines: QuoteLine[]; notes?: string }
export interface ApprovalDecisionPayload { note?: string }
export interface ManualSplitPayload { allocations: Array<{ warehouseId: string; quantity: number }> }
export interface PaymentPayload { amount: number; paidAt?: string; reference?: string }
export interface NegotiationPayload { message: string; lineId?: string; requestedDiscount?: number; requestedDeliveryDate?: string }
export interface DiscountRules { tierCeilings: Record<string, number>; categoryCeilings: Record<string, number>; approvalRouting: Array<{ condition: string; route: string }> }

export type ApiQuote = Quote