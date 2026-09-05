import { Bell, Link, TrendingDown, TrendingUp, TriangleAlert, Zap } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, PageHeader, StatusBadge } from '../components/shared'
import { useToast } from '../contexts/ToastContext'

type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

const ISSUES = [
  { deal: 'Northstar Labs', quoteId: 'q-1048', problem: 'Discount anomaly', detail: '6% above Gold tier ceiling — director approval required', date: 'Today', severity: 'Critical' as Severity, type: 'discount' },
  { deal: 'Veridian Health', quoteId: 'q-1046', problem: 'Stalled deal', detail: 'No customer activity in 9 days. Champion may have gone quiet.', date: 'Yesterday', severity: 'High' as Severity, type: 'stalled' },
  { deal: 'Tandem Retail', quoteId: 'q-1045', problem: 'Delivery slippage', detail: 'Requested delivery date has moved twice in the last 10 days.', date: 'Sep 03', severity: 'Medium' as Severity, type: 'delivery' },
  { deal: 'Atlas Freight', quoteId: 'q-1044', problem: 'Stalled deal', detail: 'Champion contact has gone quiet. No response to 2 follow-ups.', date: 'Sep 01', severity: 'Low' as Severity, type: 'stalled' },
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
  const { success, info } = useToast()
  const navigate = useNavigate()

  const filtered = ISSUES.filter((i) => severityFilter === 'All' || i.severity === severityFilter)

  function handleNudge(deal: string) {
    success(`Nudge sent to sales rep for ${deal}. They'll receive an email alert.`)
  }

  function handleEscalate(deal: string) {
    info(`${deal} escalated to Sales Manager for immediate review.`)
  }

  const critCount = ISSUES.filter((i) => i.severity === 'Critical').length
  const highCount = ISSUES.filter((i) => i.severity === 'High').length

  return (
    <>
      <PageHeader
        eyebrow="Workspace / Deal health"
        title="Deal health"
        description="A quiet signal before a loud surprise."
      />

      {/* Summary banner */}
      <div className="health-summary">
        <span className="health-big">{ISSUES.length}</span>
        <div>
          <span>deals need attention</span>
          <div className="health-counts">
            {critCount > 0 && <span className="health-count critical">{critCount} critical</span>}
            {highCount > 0 && <span className="health-count high">{highCount} high</span>}
          </div>
        </div>
        <div className="health-bar">
          <span style={{ width: `${(critCount / ISSUES.length) * 100}%` }} className="bar-critical" />
          <span style={{ width: `${(highCount / ISSUES.length) * 100}%` }} className="bar-high" />
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
              {f.value === 'All' ? ISSUES.length : ISSUES.filter((i) => i.severity === f.value).length}
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
              <div className="panel issue-card" key={issue.deal}>
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
                  <Button variant="secondary" icon={<Bell size={14} />} onClick={() => handleNudge(issue.deal)}>
                    Nudge rep
                  </Button>
                  <Button variant="quiet" icon={<Link size={14} />} onClick={() => { handleEscalate(issue.deal); navigate(`/quotations/${issue.quoteId}`) }}>
                    View deal
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
