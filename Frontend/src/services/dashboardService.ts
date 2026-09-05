import type { DashboardResponse } from '../api/types'
import { approvals, quotes } from '../data'

const dashboardDemo: DashboardResponse = {
  pipelineValue: 486200,
  pendingApprovals: approvals.length,
  openQuotations: quotes.filter((quote) => quote.status !== 'Approved').length,
  atRiskDeals: quotes.filter((quote) => quote.status === 'At risk' || quote.risk === 'High').length,
  revenueTrend: [
    { month: 'Apr', won: 28, pipeline: 44 },
    { month: 'May', won: 42, pipeline: 58 },
    { month: 'Jun', won: 38, pipeline: 63 },
    { month: 'Jul', won: 55, pipeline: 72 },
    { month: 'Aug', won: 61, pipeline: 79 },
    { month: 'Sep', won: 74, pipeline: 91 },
  ],
  recentActivity: [
    { id: 'activity-1', title: 'Quote approved', detail: 'Q-1047 · Harbor & Pine', time: '12m', href: '/quotations/q-1047', tone: 'green' },
    { id: 'activity-2', title: 'Approval requested', detail: 'Q-1048 · Northstar Labs', time: '28m', href: '/approvals/q-1048', tone: 'amber' },
    { id: 'activity-3', title: 'New recommendation', detail: 'Care Plan added to Q-1045', time: '1h', href: '/quotations/q-1045', tone: 'blue' },
    { id: 'activity-4', title: 'Deal updated', detail: 'Veridian Health · Maya Chen', time: '3h', href: '/quotations/q-1046', tone: 'purple' },
  ],
}

export interface DashboardState {
  data: DashboardResponse
  isLoading: boolean
  error: string | null
}

export function useDashboard(): DashboardState {
  return { data: dashboardDemo, isLoading: false, error: null }
}