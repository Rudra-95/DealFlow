import { Check, Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiClient } from '../api/client'
import { invoicesApi } from '../api/invoices'
import { mapInvoice } from '../api/map'
import type { InvoiceDetailData } from '../api/types'
import { Back, BillingLine, Button, Detail, PageHeader, StatusBadge } from '../components/shared'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import { money } from '../utils/format'

const DEMO_INVOICES: Record<string, InvoiceDetailData> = {
  'inv-2040': {
    id: 'inv-2040',
    number: 'INV-2040',
    customer: 'Northstar Labs',
    status: 'Unpaid',
    issued: 'September 01, 2026',
    due: 'October 01, 2026',
    terms: 'Net 30',
    total: 42860,
    paymentStatus: 'Awaiting payment',
    lines: [
      { name: 'Edge Gateway Pro', detail: '12 × $2,400 · One-time', amount: 28800 },
      { name: 'Observability Suite', detail: 'Annual · Recurring', amount: 5400 },
      { name: 'Implementation Services', detail: 'One-time', amount: 8660 },
    ],
  },
  'inv-2041': {
    id: 'inv-2041',
    number: 'INV-2041',
    customer: 'Harbor & Pine',
    status: 'Paid',
    issued: 'August 28, 2026',
    due: 'September 27, 2026',
    terms: 'Net 30',
    total: 18640,
    paymentStatus: 'Paid',
    lines: [
      { name: 'Signal Router', detail: '4 × $3,100 · One-time', amount: 18640 },
    ],
  },
  'inv-2038': {
    id: 'inv-2038',
    number: 'INV-2038',
    customer: 'Veridian Health',
    status: 'Overdue',
    issued: 'August 02, 2026',
    due: 'September 01, 2026',
    terms: 'Net 30',
    total: 72300,
    paymentStatus: 'Overdue',
    lines: [
      { name: 'Edge Gateway Pro', detail: '24 × $2,400 · One-time', amount: 72300 },
    ],
  },
}

const DEFAULT_INVOICE = DEMO_INVOICES['inv-2040']

export function InvoiceDetail() {
  const { id = 'inv-2040' } = useParams()
  const { success, info, error } = useToast()
  const fallback = useMemo(
    () => DEMO_INVOICES[id] ?? { ...DEFAULT_INVOICE, id, number: id.toUpperCase() },
    [id],
  )
  const [invoice, setInvoice] = useState(fallback)
  const [loadedId, setLoadedId] = useState(id)
  const [confirmPay, setConfirmPay] = useState(false)
  const [saving, setSaving] = useState(false)

  if (loadedId !== id) {
    setInvoice(fallback)
    setLoadedId(id)
  }

  useEffect(() => {
    if (!apiClient.baseUrl) return
    invoicesApi.get(id).then((remote) => setInvoice(mapInvoice(remote, fallback))).catch(() => undefined)
  }, [id, fallback])

  const paid = invoice.status === 'Paid' || invoice.paymentStatus === 'Paid'

  async function recordPayment() {
    if (saving || paid) return
    setSaving(true)
    setConfirmPay(false)
    try {
      if (apiClient.baseUrl) {
        const remote = await invoicesApi.recordPayment(invoice.id, {
          amount: invoice.total,
          paidAt: new Date().toISOString(),
          reference: invoice.number,
        })
        setInvoice(mapInvoice(remote, { ...invoice, status: 'Paid', paymentStatus: 'Paid' }))
      } else {
        setInvoice((prev) => ({ ...prev, status: 'Paid', paymentStatus: 'Paid' }))
      }
      success(apiClient.baseUrl ? 'Payment recorded.' : 'Payment recorded in demo mode.')
    } catch {
      error('We could not record this payment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={confirmPay}
        title="Record payment"
        message={`Record a payment of ${money(invoice.total)} for ${invoice.number}?`}
        confirmLabel="Record payment"
        onConfirm={() => void recordPayment()}
        onCancel={() => setConfirmPay(false)}
      />
      <Back to="/invoices" label="Back to invoices" />
      <PageHeader
        eyebrow={`Invoice · ${invoice.number}`}
        title={invoice.customer}
        description={`Issued ${invoice.issued} · Due ${invoice.due}`}
        action={
          <div className="header-actions">
            <Button variant="secondary" icon={<Download size={16} />} onClick={() => info('Invoice summary is shown on this page. No export endpoint is configured.')}>
              Download summary
            </Button>
            <Button icon={<Check size={16} />} disabled={saving || paid} onClick={() => setConfirmPay(true)}>
              {saving ? 'Recording…' : paid ? 'Paid' : 'Record payment'}
            </Button>
          </div>
        }
      />
      <section className="panel lifecycle">
        <div className="lifecycle-step done"><span><Check size={14} /></span><strong>Order confirmed</strong><small>Aug 18</small></div>
        <div className="lifecycle-line done" />
        <div className="lifecycle-step done"><span><Check size={14} /></span><strong>Shipped</strong><small>Aug 22</small></div>
        <div className="lifecycle-line done" />
        <div className={`lifecycle-step ${paid ? 'done' : 'active'}`}><span>{paid ? <Check size={14} /> : '3'}</span><strong>Invoiced</strong><small>Sep 01</small></div>
        <div className={`lifecycle-line ${paid ? 'done' : ''}`} />
        <div className={`lifecycle-step ${paid ? 'done' : ''}`}><span>{paid ? <Check size={14} /> : '4'}</span><strong>Paid</strong><small>{paid ? 'Recorded' : 'Pending'}</small></div>
      </section>
      <div className="invoice-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Invoice summary</h2>
              <p>{invoice.number} · USD</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
          {invoice.lines.map((line) => (
            <BillingLine key={line.name} name={line.name} detail={line.detail} amount={money(line.amount)} />
          ))}
          <div className="invoice-total"><span>Total due</span><strong>{money(invoice.total)}</strong></div>
        </section>
        <section className="panel side-details">
          <h3>Payment details</h3>
          <Detail label="Payment status" value={paid ? 'Paid' : invoice.paymentStatus} />
          <Detail label="Due date" value={invoice.due} />
          <Detail label="Terms" value={invoice.terms} />
        </section>
      </div>
    </>
  )
}
