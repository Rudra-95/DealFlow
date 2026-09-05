import { Plus, ShieldCheck, Sparkles, Trash2, TrendingUp, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Back, Button, Detail, PageHeader, StatusBadge, WorkflowStep } from '../components/shared'
import { quotes, recommendations } from '../data'
import { useToast } from '../contexts/ToastContext'
import { money } from '../utils/format'

export function QuotationDetail() {
  const { id = 'q-1048' } = useParams()
  const navigate = useNavigate()
  const { success, info } = useToast()
  const sourceQuote = quotes.find((item) => item.id === id) ?? quotes[0]

  const [lines, setLines] = useState(sourceQuote.lines)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const isNew = id === 'q-new'
  const quote = isNew ? quotes[0] : sourceQuote

  const total = lines.reduce((sum, line) => sum + line.quantity * line.price * (1 - line.discount / 100), 0)

  function addRecommendation(rec: typeof recommendations[0]) {
    if (lines.find((l) => l.product === rec.name)) {
      info(`${rec.name} is already in this quotation.`)
      return
    }
    setLines((prev) => [
      ...prev,
      { id: `l-rec-${Date.now()}`, product: rec.name, sku: rec.productId, quantity: 1, price: rec.price, discount: 0, maxDiscount: 10 },
    ])
    success(`${rec.name} added to quotation.`)
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId))
    info('Line item removed.')
  }

  async function handleSubmit() {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSubmitting(false)
    setSubmitted(true)
    success('Quotation submitted for approval. Routing to Sales Manager.')
    setTimeout(() => navigate('/approvals'), 1500)
  }

  function handleSave() {
    success('Draft saved successfully.')
  }

  function discountStatus(discount: number, max: number) {
    if (discount === 0) return 'no-discount'
    if (discount <= max) return 'within-limit'
    if (discount <= max + 5) return 'approval-required'
    return 'high-risk'
  }

  return (
    <>
      <Back to="/quotations" label="Back to quotations" />
      <PageHeader
        eyebrow={`Quotation ${isNew ? '(New)' : quote.number}`}
        title={isNew ? 'New quotation' : quote.customer}
        description={isNew ? 'Build and price your new deal.' : `${quote.number} · Owned by ${quote.owner} · Updated ${quote.updated}`}
        action={
          <div className="header-actions">
            <Button variant="secondary" onClick={handleSave}>Save draft</Button>
          </div>
        }
      />

      <div className="quote-layout">
        {/* Lines panel */}
        <section className="panel quote-lines">
          <div className="panel-heading">
            <div>
              <h2>Line items</h2>
              <p>Pricing and discount governance</p>
            </div>
            <Button variant="secondary" icon={<Plus size={16} />}>Add product</Button>
          </div>

          <div className="quote-lines-list">
            {lines.map((line) => {
              const dStatus = discountStatus(line.discount, line.maxDiscount)
              const lineTotal = line.quantity * line.price * (1 - line.discount / 100)
              return (
                <div className={`quote-line-row ${dStatus === 'approval-required' ? 'line-warn' : dStatus === 'high-risk' ? 'line-danger' : ''}`} key={line.id}>
                  <div className="product-badge">{line.product[0]}</div>
                  <div className="line-main">
                    <strong>{line.product}</strong>
                    <span>{line.sku} · {line.quantity} × {money(line.price)}</span>
                    {line.recurring && <span className="recurring-chip">↻ Recurring</span>}
                  </div>
                  <div className="line-discount-col">
                    <span className="col-label">Discount</span>
                    <strong className={dStatus === 'within-limit' ? 'text-success' : dStatus !== 'no-discount' ? 'text-warn' : ''}>
                      {line.discount}%
                    </strong>
                    <span className="col-sub">max {line.maxDiscount}%</span>
                  </div>
                  <div className="line-status-col">
                    {dStatus !== 'no-discount' && (
                      <StatusBadge status={
                        dStatus === 'within-limit' ? 'Within limit' :
                        dStatus === 'approval-required' ? 'Approval required' : 'At risk'
                      } />
                    )}
                  </div>
                  <div className="line-total-col">
                    <strong>{money(lineTotal)}</strong>
                  </div>
                  <button className="line-remove" onClick={() => removeLine(line.id)} aria-label="Remove line">
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="quote-summary">
            <span>Estimated total</span>
            <strong>{money(total)}</strong>
          </div>

          {/* Upsell/cross-sell recommendations */}
          <div className="recommendations-section">
            <div className="rec-header">
              <TrendingUp size={14} />
              <strong>Upsell & cross-sell suggestions</strong>
              <span className="rec-subtitle">Based on products in this quote</span>
            </div>
            <div className="recommendations">
              {recommendations.map((rec) => {
                const alreadyAdded = lines.some((l) => l.product === rec.name)
                return (
                  <div className={`recommendation ${alreadyAdded ? 'rec-added' : ''}`} key={rec.name}>
                    <div className="recommendation-icon"><Sparkles size={13} /></div>
                    <strong>{rec.name}</strong>
                    <p>{rec.reason}</p>
                    <span>{money(rec.price)}</span>
                    <Button
                      variant={alreadyAdded ? 'secondary' : 'quiet'}
                      icon={alreadyAdded ? undefined : <Plus size={12} />}
                      onClick={() => addRecommendation(rec)}
                    >
                      {alreadyAdded ? '✓ Added' : 'Add to quote'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Aside */}
        <aside className="quote-aside">
          <section className="panel approval-card">
            <div className="eyebrow">Workflow</div>
            <h2>Ready for approval</h2>
            <p>Discount exceptions will route to the appropriate approver.</p>
            <div className="workflow">
              <WorkflowStep label="Draft" done />
              <WorkflowStep label="Sales Manager" active={!submitted} done={submitted} />
              <WorkflowStep label="Finance" active={submitted} />
              <WorkflowStep label="Confirmed" />
            </div>
            <Button
              icon={submitted ? undefined : <ShieldCheck size={16} />}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting…' : submitted ? '✓ Submitted' : 'Submit for approval'}
            </Button>
          </section>

          <section className="panel side-details">
            <h3>Quote details</h3>
            <Detail label="Price list" value="Enterprise · USD" />
            <Detail label="Customer tier" value="Gold" />
            <Detail label="Payment terms" value="Net 30" />
            <Detail label="Valid until" value="Oct 05, 2026" />
          </section>

          <section className="panel side-details">
            <h3>Discount governance</h3>
            {lines.filter((l) => l.discount > l.maxDiscount).length === 0 ? (
              <p className="governance-ok">✓ All discounts are within tier limits.</p>
            ) : (
              lines.filter((l) => l.discount > l.maxDiscount).map((l) => (
                <div className="governance-warn" key={l.id}>
                  <X size={12} />
                  <span>{l.product}: {l.discount}% exceeds {l.maxDiscount}% limit</span>
                </div>
              ))
            )}
          </section>
        </aside>
      </div>
    </>
  )
}
