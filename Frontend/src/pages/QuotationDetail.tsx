import { Plus, ShieldCheck, Sparkles, Trash2, TrendingUp, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../api/client'
import { mapQuote } from '../api/map'
import { quotationsApi } from '../api/quotations'
import { Back, Button, Detail, PageHeader, StatusBadge, WorkflowStep } from '../components/shared'
import { useToast } from '../contexts/ToastContext'
import { products, quotes, recommendations } from '../data'
import { money } from '../utils/format'

export function QuotationDetail() {
  const { id = 'q-1048' } = useParams()
  const navigate = useNavigate()
  const { success, info, error } = useToast()
  const isNew = id === 'q-new'
  const fallbackQuote = useMemo(() => quotes.find((item) => item.id === id) ?? quotes[0], [id])

  const [quote, setQuote] = useState(fallbackQuote)
  const [lines, setLines] = useState(fallbackQuote.lines)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quoteId, setQuoteId] = useState(id)

  if (!isNew && quoteId !== id) {
    setQuote(fallbackQuote)
    setLines(fallbackQuote.lines)
    setQuoteId(id)
    setSubmitted(false)
  }

  useEffect(() => {
    if (!apiClient.baseUrl || isNew) return
    quotationsApi.get(id).then((remote) => {
      const mapped = mapQuote(remote, fallbackQuote)
      setQuote(mapped)
      setLines(mapped.lines)
      setQuoteId(mapped.id)
    }).catch(() => undefined)
  }, [id, isNew, fallbackQuote])

  const canEdit = !submitted && quote.status !== 'Approved' && quote.status !== 'Rejected'
  const total = lines.reduce((sum, line) => sum + line.quantity * line.price * (1 - line.discount / 100), 0)

  function addRecommendation(rec: typeof recommendations[0]) {
    if (!canEdit) return
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
    if (!canEdit) return
    setLines((prev) => prev.filter((l) => l.id !== lineId))
    info('Line item removed.')
  }

  function updateLine(lineId: string, field: 'quantity' | 'discount', value: number) {
    if (!canEdit) return
    setLines((prev) => prev.map((line) => {
      if (line.id !== lineId) return line
      if (field === 'quantity') return { ...line, quantity: Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1) }
      return { ...line, discount: Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)) }
    }))
  }

  function addProduct() {
    if (!canEdit) return
    const next = products.find((product) => !lines.some((line) => line.product === product.name || line.sku === product.sku))
    if (!next) {
      info('Every catalog product is already on this quotation.')
      return
    }
    setLines((prev) => [
      ...prev,
      { id: `l-add-${Date.now()}`, product: next.name, sku: next.sku, quantity: 1, price: next.price, discount: 0, maxDiscount: 10, recurring: next.recurring },
    ])
    success(`${next.name} added to quotation.`)
  }

  async function handleSubmit() {
    if (submitting || submitted) return
    setSubmitting(true)
    try {
      if (apiClient.baseUrl && !isNew) {
        await quotationsApi.update(quoteId, { customerId: quote.customer, lines, notes: 'Updated from DealFlow360 quotation builder' })
        await quotationsApi.submit(quoteId)
      }
      setSubmitted(true)
      success(apiClient.baseUrl ? 'Quotation submitted for approval.' : 'Quotation submitted for approval in demo mode.')
      setTimeout(() => navigate('/approvals'), 1500)
    } catch {
      error('We could not submit this quotation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      if (apiClient.baseUrl) {
        const payload = { customerId: quote.customer, lines, notes: 'Updated from DealFlow360 quotation builder' }
        if (isNew) {
          const created = mapQuote(await quotationsApi.create(payload), quote)
          setQuote(created)
          setLines(created.lines)
          setQuoteId(created.id)
          navigate(`/quotations/${created.id}`, { replace: true })
        } else {
          const updated = mapQuote(await quotationsApi.update(quoteId, payload), { ...quote, lines })
          setQuote(updated)
          setLines(updated.lines)
        }
      }
      success(apiClient.baseUrl ? 'Quotation saved.' : 'Draft saved in demo mode.')
    } catch {
      error('We could not save this quotation. Please try again.')
    } finally {
      setSaving(false)
    }
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
            <Button variant="secondary" onClick={handleSave} disabled={saving || !canEdit}>{saving ? 'Saving…' : 'Save draft'}</Button>
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
            <Button variant="secondary" icon={<Plus size={16} />} onClick={addProduct} disabled={!canEdit}>Add product</Button>
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
                    <input className="quote-edit-input" type="number" min="0" max="100" value={line.discount} disabled={!canEdit} onChange={(event) => updateLine(line.id, 'discount', Number(event.target.value))} aria-label={`${line.product} discount`} />
                    <span className="col-sub">max {line.maxDiscount}%</span>
                  </div>
                  <div className="line-quantity-col">
                    <span className="col-label">Quantity</span>
                    <input className="quote-edit-input" type="number" min="1" value={line.quantity} disabled={!canEdit} onChange={(event) => updateLine(line.id, 'quantity', Number(event.target.value))} aria-label={`${line.product} quantity`} />
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
              disabled={submitting || submitted}
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
