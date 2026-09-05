import { Bell, Link, TrendingDown, TrendingUp, TriangleAlert, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { dealHealthApi } from '../api/dealHealth'
import { mapDealHealthIssues } from '../api/map'
import type { DealHealthIssue } from '../api/types'
import { Button, PageHeader, StatusBadge } from '../components/shared'
import { useToast } from '../contexts/ToastContext'

type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

const ISSUES: DealHealthIssue[] = [
  { id: 'q-1048', deal: 'Northstar Labs', quoteId: 'q-1048', problem: 'Discount anomaly', detail: '6% above Gold tier ceiling — director approval required', date: 'Today', severity: 'Critical', type: 'discount' },
  { id: 'q-1046', deal: 'Veridian Health', quoteId: 'q-1046', problem: 'Stalled deal', detail: 'No customer activity in 9 days. Champion may have gone quiet.', date: 'Yesterday', severity: 'High', type: 'stalled' },
  { id: 'q-1045', deal: 'Tandem Retail', quoteId: 'q-1045', problem: 'Delivery slippage', detail: 'Requested delivery date has moved twice in the last 10 days.', date: 'Sep 03', severity: 'Medium', type: 'delivery' },
  { id: 'q-1044', deal: 'Atlas Freight', quoteId: 'q-1044', problem: 'Stalled deal', detail: 'Champion contact has gone quiet. No response to 2 follow-ups.', date: 'Sep 01', severity: 'Low', type: 'stalled' },
]

const problemIcons = {
  discount: TriangleAlert,
  stalled: TrendingDown,
  delivery: TrendingUp,
}

const SEVERITY_FILTERS: Array<{ label: string; value: Severity | 'All' }> = [
  { label: 'All', value: 'All' },
  { label: 'Critical', value: 'Critical' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
]

export function DealHealth() {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All')
  const [issues, setIssues] = useState(ISSUES)
  const { success, info, error } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!apiClient.baseUrl) return
    dealHealthApi.list().then((remote) => setIssues(mapDealHealthIssues(remote, ISSUES))).catch(() => undefined)
  }, [])

  const filtered = issues.filter((i) => severityFilter === 'All' || i.severity === severityFilter)

  async function handleNudge(issue: DealHealthIssue) {
    try {
      if (apiClient.baseUrl) await dealHealthApi.nudge(issue.id || issue.quoteId)
      success(apiClient.baseUrl ? `Nudge sent for ${issue.deal}.` : `Nudge saved in demo mode for ${issue.deal}.`)
    } catch { error(`We could not nudge ${issue.deal}. Please try again.`) }
  }

  async function handleEscalate(issue: DealHealthIssue) {
    try {
      if (apiClient.baseUrl) await dealHealthApi.escalate(issue.id || issue.quoteId)
      info(apiClient.baseUrl ? `${issue.deal} escalated for review.` : `${issue.deal} escalation saved in demo mode.`)
      navigate(`/quotations/${issue.quoteId}`)
    } catch { error(`We could not escalate ${issue.deal}. Please try again.`) }
  }

  const critCount = issues.filter((i) => i.severity === 'Critical').length
  const highCount = issues.filter((i) => i.severity === 'High').length

  return (
    <>
      <PageHeader
        eyebrow="Workspace / Deal health"
        title="Deal health"
        description="A quiet signal before a loud surprise."
      />

      {/* Summary banner */}
      <div className="health-summary">
        <span className="health-big">{issues.length}</span>
        <div>
          <span>deals need attention</span>
          <div className="health-counts">
            {critCount > 0 && <span className="health-count critical">{critCount} critical</span>}
            {highCount > 0 && <span className="health-count high">{highCount} high</span>}
          </div>
        </div>
        <div className="health-bar">
          <span style={{ width: `${issues.length ? (critCount / issues.length) * 100 : 0}%` }} className="bar-critical" />
          <span style={{ width: `${issues.length ? (highCount / issues.length) * 100 : 0}%` }} className="bar-high" />
        </div>
      </div>

      {/* Severity filter tabs */}
      <div className="status-filter-tabs health-filter-tabs">
        {SEVERITY_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`status-tab ${severityFilter === f.value ? 'active' : ''}`}
            onClick={() => setSeverityFilter(f.value)}
          >
            {f.label}
            <span className="status-tab-count">
              {f.value === 'All' ? issues.length : issues.filter((i) => i.severity === f.value).length}
            </span>
          </button>
        ))}
      </div>

      <section className="issue-grid">
        {filtered.length === 0 ? (
          <div className="panel issue-empty">No issues at this severity level. 🎉</div>
        ) : (
          filtered.map((issue) => {
            const Icon = problemIcons[issue.type as keyof typeof problemIcons] ?? Zap
            return (
              <div className="panel issue-card" key={issue.id || issue.deal}>
                <div className="issue-head">
                  <StatusBadge status={issue.severity} />
                  <span>{issue.date}</span>
                </div>
                <div className="issue-icon-row">
                  <div className={`issue-type-icon sev-${issue.severity.toLowerCase()}`}><Icon size={14} /></div>
                  <h2>{issue.problem}</h2>
                </div>
                <strong>{issue.deal}</strong>
                <p>{issue.detail}</p>
                <div className="issue-actions">
                  <Button variant="secondary" icon={<Bell size={14} />} onClick={() => void handleNudge(issue)}>
                    Nudge rep
                  </Button>
                  <Button variant="quiet" icon={<Link size={14} />} onClick={() => void handleEscalate(issue)}>
                    Escalate
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </section>
    </>
  )
}
