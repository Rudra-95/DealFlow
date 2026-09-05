import { AlertCircle, Check, MessageSquare } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { approvalsApi } from '../api/approvals'
import { apiClient } from '../api/client'
import { mapQuote } from '../api/map'
import { Back, Button, PageHeader, StatusBadge, WorkflowStep } from '../components/shared'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import { quotes } from '../data'
import { money } from '../utils/format'

const AUDIT_TRAIL = [
  { user: 'Jordan Lee', action: 'Submitted', date: 'Aug 29', note: 'Initial 12% discount' },
  { user: 'M. Shah', action: 'Returned', date: 'Aug 31', note: 'Requested justification' },
  { user: 'J. Ray', action: 'Resubmitted', date: 'Sep 1', note: 'Added margin note' },
]

export function ApprovalDetail() {
  const { id = 'q-1048' } = useParams()
  const navigate = useNavigate()
  const { success, warn, error: notifyError } = useToast()
  const fallback = useMemo(() => quotes.find((item) => item.id === id) ?? quotes[0], [id])
  const [quote, setQuote] = useState(fallback)
  const [loadedId, setLoadedId] = useState(id)

  const [decision, setDecision] = useState<'Pending' | 'Approved' | 'Returned' | 'Rejected'>(
    fallback.status === 'Approved' || fallback.status === 'Returned' || fallback.status === 'Rejected' ? fallback.status : 'Pending',
  )
  const [note, setNote] = useState('')
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [processing, setProcessing] = useState(false)

  if (loadedId !== id) {
    setQuote(fallback)
    setLoadedId(id)
    setDecision(fallback.status === 'Approved' || fallback.status === 'Returned' || fallback.status === 'Rejected' ? fallback.status : 'Pending')
  }

  useEffect(() => {
    if (!apiClient.baseUrl) return
    approvalsApi.get(id).then((remote) => {
      const mapped = mapQuote(remote, fallback)
      setQuote(mapped)
      if (mapped.status === 'Approved' || mapped.status === 'Returned' || mapped.status === 'Rejected') {
        setDecision(mapped.status)
      }
    }).catch(() => undefined)
  }, [id, fallback])

  async function handleApprove() {
    if (processing || decision !== 'Pending') return
    setProcessing(true)
    try {
      if (apiClient.baseUrl) await approvalsApi.approve(id, { note: note || undefined })
      setDecision('Approved')
      success(apiClient.baseUrl ? 'Quote approved and routed to Finance.' : 'Quote approved in demo mode.')
      setTimeout(() => navigate('/approvals'), 1800)
    } catch {
      notifyError('We could not approve this quote. Please try again.')
    } finally { setProcessing(false) }
  }

  async function handleReturn() {
    if (processing || decision !== 'Pending') return
    setProcessing(true)
    try {
      if (apiClient.baseUrl) await approvalsApi.returnForRevision(id, { note: note || undefined })
      setDecision('Returned')
      warn(apiClient.baseUrl ? 'Quote returned to sales rep for revision.' : 'Quote returned in demo mode.')
      setTimeout(() => navigate('/approvals'), 1500)
    } catch {
      notifyError('We could not return this quote. Please try again.')
    } finally { setProcessing(false) }
  }

  async function handleReject() {
    if (processing || decision !== 'Pending') return
    setProcessing(true)
    setShowRejectConfirm(false)
    try {
      if (apiClient.baseUrl) await approvalsApi.reject(id, { note: note || undefined })
      setDecision('Rejected')
      notifyError(apiClient.baseUrl ? 'Quote rejected. Sales rep has been notified.' : 'Quote rejected in demo mode.')
      setTimeout(() => navigate('/approvals'), 1500)
    } catch {
      notifyError('We could not reject this quote. Please try again.')
    } finally { setProcessing(false) }
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
            <Button icon={<Check size={16} />} onClick={handleApprove} disabled={processing || decision !== 'Pending'}>
              {processing ? 'Processing…' : 'Approve & route'}
            </Button>
            <Button variant="secondary" onClick={handleReturn} disabled={processing || decision !== 'Pending'}>
              {processing ? 'Processing…' : 'Return for revision'}
            </Button>
            <Button variant="danger" onClick={() => setShowRejectConfirm(true)} disabled={processing || decision !== 'Pending'}>
              {processing ? 'Processing…' : 'Reject quote'}
            </Button>
          </div>
        </aside>
      </div>
    </>
  )
}
