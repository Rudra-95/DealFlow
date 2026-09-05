import { AlertCircle, Check, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Back, Button, PageHeader, StatusBadge, WorkflowStep } from '../components/shared'
import { quotes } from '../data'
import { useToast } from '../contexts/ToastContext'
import { money } from '../utils/format'

const AUDIT_TRAIL = [
  { user: 'Jordan Lee', action: 'Submitted', date: 'Aug 29', note: 'Initial 12% discount' },
  { user: 'M. Shah', action: 'Returned', date: 'Aug 31', note: 'Requested justification' },
  { user: 'J. Ray', action: 'Resubmitted', date: 'Sep 1', note: 'Added margin note' },
]

export function ApprovalDetail() {
  const { id = 'q-1048' } = useParams()
  const navigate = useNavigate()
  const { success, error: toastError, warn } = useToast()
  const quote = quotes.find((item) => item.id === id) ?? quotes[0]

  const [decision, setDecision] = useState<'Pending' | 'Approved' | 'Returned' | 'Rejected'>('Pending')
  const [note, setNote] = useState('')
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)

  function handleApprove() {
    setDecision('Approved')
    success('Quote approved and routed to Finance for final confirmation.')
    setTimeout(() => navigate('/approvals'), 1800)
  }

  function handleReturn() {
    setDecision('Returned')
    warn('Quote returned to sales rep for revision.')
    setTimeout(() => navigate('/approvals'), 1500)
  }

  function handleReject() {
    setShowRejectConfirm(false)
    setDecision('Rejected')
    toastError('Quote rejected. Sales rep has been notified.')
    setTimeout(() => navigate('/approvals'), 1500)
  }

  const hasOverLimit = quote.lines.some((l) => l.discount > l.maxDiscount)

  return (
    <>
      <ConfirmDialog
        open={showRejectConfirm}
        title="Reject quotation"
        message={`Are you sure you want to reject ${quote.number}? The sales rep will be notified and the deal will be closed. This action cannot be undone.`}
        confirmLabel="Reject quote"
        variant="danger"
        onConfirm={handleReject}
        onCancel={() => setShowRejectConfirm(false)}
      />

      <Back to="/approvals" label="Back to approvals" />
      <PageHeader
        eyebrow={`Approval review · ${quote.number}`}
        title="Review requested"
        description={`${quote.customer} · submitted by ${quote.owner}`}
        action={<StatusBadge status={decision} />}
      />

      {hasOverLimit && (
        <section className="panel risk-banner">
          <div className="risk-icon"><AlertCircle size={18} /></div>
          <div>
            <strong>High-risk discount exception</strong>
            <p>One or more lines exceed the customer tier ceiling. Manager or Finance approval required.</p>
          </div>
          <div className="risk-number">
            {quote.lines.filter((l) => l.discount > l.maxDiscount).length}
            <small>line{quote.lines.filter((l) => l.discount > l.maxDiscount).length !== 1 ? 's' : ''} over limit</small>
          </div>
        </section>
      )}

      <div className="approval-layout">
        <div className="approval-main">
          {/* Discount analysis */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Discount analysis</h2>
                <p>Compare requested discounts against governing limits.</p>
              </div>
            </div>
            {quote.lines.map((line) => {
              const over = line.discount > line.maxDiscount
              const impact = over ? line.quantity * line.price * ((line.discount - line.maxDiscount) / 100) : 0
              return (
                <div className="analysis-row" key={line.id}>
                  <div>
                    <strong>{line.product}</strong>
                    <span>{line.sku}</span>
                  </div>
                  <div>
                    <small>Allowed</small>
                    <strong>{line.maxDiscount}%</strong>
                  </div>
                  <div>
                    <small>Requested</small>
                    <strong className={over ? 'text-danger' : ''}>{line.discount}%</strong>
                  </div>
                  <div>
                    <small>Impact</small>
                    <strong className={over ? 'text-danger' : ''}>{over ? money(impact) : '—'}</strong>
                  </div>
                  <div>
                    <StatusBadge status={over ? 'Approval required' : 'Within limit'} />
                  </div>
                </div>
              )
            })}
          </section>

          {/* Audit trail */}
          <section className="panel audit-panel">
            <div className="panel-heading">
              <div>
                <h2>Audit trail</h2>
                <p>Full history of actions on this approval.</p>
              </div>
            </div>
            {AUDIT_TRAIL.map((entry) => (
              <div className="activity" key={entry.action + entry.date}>
                <div className="activity-icon blue"><MessageSquare size={12} /></div>
                <div>
                  <strong>{entry.user} · {entry.action}</strong>
                  <span>{entry.note}</span>
                </div>
                <time>{entry.date}</time>
              </div>
            ))}
          </section>
        </div>

        {/* Decision panel */}
        <aside className="panel decision-card">
          <div className="eyebrow">Your decision</div>
          <h2>Move this deal forward</h2>
          <p>Your action will be logged and the relevant parties notified immediately.</p>

          <div className="workflow">
            <WorkflowStep label="Submitted" done />
            <WorkflowStep label="Sales Manager" active={decision === 'Pending'} done={decision !== 'Pending'} />
            <WorkflowStep label="Finance" active={decision === 'Approved'} />
            <WorkflowStep label="Confirmed" />
          </div>

          <label className="decision-note-label">
            Note (optional)
            <textarea
              className="decision-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context for the audit trail..."
              rows={3}
            />
          </label>

          <div className="decision-actions">
            <Button icon={<Check size={16} />} onClick={handleApprove}>
              Approve & route
            </Button>
            <Button variant="secondary" onClick={handleReturn}>
              Return for revision
            </Button>
            <Button variant="danger" onClick={() => setShowRejectConfirm(true)}>
              Reject quote
            </Button>
          </div>
        </aside>
      </div>
    </>
  )
}
