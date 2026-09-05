import { Check, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, StatusBadge, Table } from '../components/shared'
import { approvals } from '../data'

type FilterTab = 'pending' | 'approved' | 'returned' | 'all'

const TABS: Array<{ key: FilterTab; label: string }> = [
  { key: 'pending', label: 'Needs review' },
  { key: 'approved', label: 'Approved' },
  { key: 'returned', label: 'Returned' },
  { key: 'all', label: 'All activity' },
]

// Augment approvals with demo data for other states
const ALL_APPROVALS = [
  ...approvals,
  { id: 'q-1044', number: 'Q-1044', customer: 'Atlas Freight', owner: 'Jordan Lee', status: 'Approved' as const, risk: 'Low' as const, total: 38900, updated: '2 days ago', lines: [] },
  { id: 'q-1045', number: 'Q-1045', customer: 'Tandem Retail', owner: 'Avery Smith', status: 'Returned' as const, risk: 'Medium' as const, total: 12400, updated: 'Yesterday', lines: [] },
]

const STAGE_MAP: Record<string, string> = {
  Pending: 'Sales Manager review',
  'At risk': 'Finance review',
  Approved: 'Confirmed',
  Returned: 'Awaiting revision',
}

export function Approvals() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FilterTab>('pending')

  const filtered = ALL_APPROVALS.filter((a) => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return a.status === 'Pending' || a.status === 'At risk'
    if (activeTab === 'approved') return a.status === 'Approved'
    if (activeTab === 'returned') return a.status === 'Returned'
    return true
  })

  const pendingCount = ALL_APPROVALS.filter((a) => a.status === 'Pending' || a.status === 'At risk').length

  return (
    <>
      <PageHeader
        eyebrow="Workspace / Approvals"
        title="Approval queue"
        description="Make informed decisions with context, not guesswork."
      />

      <div className="segmented">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'selected' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && <b>{pendingCount}</b>}
            {tab.key === 'approved' && <span className="seg-count">
              {ALL_APPROVALS.filter((a) => a.status === 'Approved').length}
            </span>}
          </button>
        ))}
      </div>

      <Table>
        <thead>
          <tr>
            <th>Quotation</th>
            <th>Customer</th>
            <th>Risk</th>
            <th>Stage</th>
            <th>Submitted</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={7} className="table-empty">No approvals in this category.</td></tr>
          ) : (
            filtered.map((quote) => (
              <tr key={quote.id} onClick={() => navigate(`/approvals/${quote.id}`)}>
                <td>
                  <strong>{quote.number}</strong>
                  <span className="table-muted">{quote.owner}</span>
                </td>
                <td>{quote.customer}</td>
                <td><StatusBadge status={quote.risk} /></td>
                <td>{STAGE_MAP[quote.status] ?? 'Review'}</td>
                <td className="table-muted">Today, 9:42 AM</td>
                <td><StatusBadge status={quote.status} /></td>
                <td>
                  {quote.status === 'Approved' ? (
                    <Check size={15} className="text-success-icon" />
                  ) : (
                    <ChevronRight size={17} />
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  )
}
