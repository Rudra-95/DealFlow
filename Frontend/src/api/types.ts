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

export interface BillingItem {
  name: string
  detail: string
  amount: number
}

export interface InvoiceDetailData {
  id: string
  number: string
  customer: string
  status: string
  issued: string
  due: string
  terms: string
  total: number
  paymentStatus: string
  lines: BillingItem[]
}

export interface SubscriptionDetailData {
  id: string
  number: string
  customer: string
  status: string
  started: string
  nextBilling: string
  recurring: BillingItem[]
  oneTime: BillingItem[]
}

export interface DealHealthIssue {
  id: string
  deal: string
  quoteId: string
  problem: string
  detail: string
  date: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  type: string
}

export interface ReportsData {
  quotesCreated: string
  quotesCreatedDetail: string
  avgApprovalTime: string
  avgApprovalTimeDetail: string
  topUpsell: string
  topUpsellDetail: string
  winRate: string
  winRateDetail: string
  quoteVelocity: Array<{ w: string; created: number; approved: number }>
}