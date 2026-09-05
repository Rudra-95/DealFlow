import type { Quote, QuoteLine } from '../data'
import type { BillingItem, DealHealthIssue, InvoiceDetailData, ReportsData, SubscriptionDetailData } from './types'

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  return {}
}

export function unwrap(value: unknown): unknown {
  const record = asRecord(value)
  if (record.data !== undefined) return record.data
  return value
}

export function pickString(record: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return fallback
}

export function pickNumber(record: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return fallback
}

export function pickArray(record: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) return value
  }
  return []
}

export function pickBoolean(record: Record<string, unknown>, keys: string[], fallback = false): boolean {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'boolean') return value
  }
  return fallback
}

function mapBillingItem(raw: unknown, fallback?: BillingItem): BillingItem {
  const record = asRecord(raw)
  const amount = pickNumber(record, ['amount', 'total', 'price', 'unitAmount'], fallback?.amount ?? 0)
  return {
    name: pickString(record, ['name', 'product', 'productName', 'title'], fallback?.name ?? 'Line item'),
    detail: pickString(record, ['detail', 'sku', 'description', 'cycle'], fallback?.detail ?? ''),
    amount,
  }
}

export function mapQuoteLine(raw: unknown, fallback?: QuoteLine, index = 0): QuoteLine {
  const record = asRecord(raw)
  return {
    id: pickString(record, ['id', 'lineId'], fallback?.id ?? `line-${index}`),
    product: pickString(record, ['product', 'name', 'productName'], fallback?.product ?? 'Product'),
    sku: pickString(record, ['sku', 'productSku', 'productId'], fallback?.sku ?? ''),
    quantity: pickNumber(record, ['quantity', 'qty'], fallback?.quantity ?? 1),
    price: pickNumber(record, ['price', 'unitPrice', 'listPrice'], fallback?.price ?? 0),
    discount: pickNumber(record, ['discount', 'discountPercent', 'requestedDiscount'], fallback?.discount ?? 0),
    maxDiscount: pickNumber(record, ['maxDiscount', 'discountCeiling', 'allowedDiscount'], fallback?.maxDiscount ?? 10),
    recurring: pickBoolean(record, ['recurring', 'isRecurring'], fallback?.recurring ?? false) || undefined,
  }
}

export function mapQuote(raw: unknown, fallback: Quote): Quote {
  const record = asRecord(unwrap(raw))
  const lines = pickArray(record, ['lines', 'lineItems', 'items'])
  return {
    ...fallback,
    id: pickString(record, ['id', 'quoteId'], fallback.id),
    number: pickString(record, ['number', 'quoteNumber'], fallback.number),
    customer: pickString(record, ['customer', 'customerName', 'customerId'], fallback.customer),
    owner: pickString(record, ['owner', 'ownerName', 'salesperson'], fallback.owner),
    status: (pickString(record, ['status'], fallback.status) as Quote['status']) || fallback.status,
    total: pickNumber(record, ['total', 'amount', 'grandTotal'], fallback.total),
    updated: pickString(record, ['updated', 'updatedAt', 'modifiedAt'], fallback.updated),
    risk: (pickString(record, ['risk', 'riskLevel'], fallback.risk) as Quote['risk']) || fallback.risk,
    lines: lines.length ? lines.map((line, index) => mapQuoteLine(line, fallback.lines[index], index)) : fallback.lines,
  }
}

export function mapDealHealthIssues(raw: unknown, fallback: DealHealthIssue[]): DealHealthIssue[] {
  const unwrapped = unwrap(raw)
  const items = Array.isArray(unwrapped) ? unwrapped : pickArray(asRecord(unwrapped), ['items', 'issues', 'deals'])
  if (!items.length) return fallback
  return items.map((item, index) => {
    const record = asRecord(item)
    const severityRaw = pickString(record, ['severity', 'level'], fallback[index]?.severity ?? 'Medium')
    const severity = (['Critical', 'High', 'Medium', 'Low'].includes(severityRaw) ? severityRaw : 'Medium') as DealHealthIssue['severity']
    const quoteId = pickString(record, ['quoteId', 'quotationId', 'id'], fallback[index]?.quoteId ?? `q-${index}`)
    return {
      id: pickString(record, ['id', 'issueId'], quoteId),
      deal: pickString(record, ['deal', 'customer', 'name', 'title'], fallback[index]?.deal ?? 'Deal'),
      quoteId,
      problem: pickString(record, ['problem', 'title', 'issue'], fallback[index]?.problem ?? 'Attention needed'),
      detail: pickString(record, ['detail', 'description', 'reason'], fallback[index]?.detail ?? ''),
      date: pickString(record, ['date', 'updated', 'updatedAt'], fallback[index]?.date ?? ''),
      severity,
      type: pickString(record, ['type', 'category'], fallback[index]?.type ?? 'stalled'),
    }
  })
}

export function mapInvoice(raw: unknown, fallback: InvoiceDetailData): InvoiceDetailData {
  const record = asRecord(unwrap(raw))
  const lines = pickArray(record, ['lines', 'lineItems', 'items'])
  const total = pickNumber(record, ['total', 'amount', 'balanceDue', 'grandTotal'], fallback.total)
  return {
    ...fallback,
    id: pickString(record, ['id', 'invoiceId'], fallback.id),
    number: pickString(record, ['number', 'invoiceNumber'], fallback.number),
    customer: pickString(record, ['customer', 'customerName'], fallback.customer),
    status: pickString(record, ['status', 'paymentStatus'], fallback.status),
    issued: pickString(record, ['issued', 'issuedAt', 'issueDate'], fallback.issued),
    due: pickString(record, ['due', 'dueDate', 'dueAt'], fallback.due),
    terms: pickString(record, ['terms', 'paymentTerms'], fallback.terms),
    total,
    paymentStatus: pickString(record, ['paymentStatus', 'status'], fallback.paymentStatus),
    lines: lines.length ? lines.map((line, index) => mapBillingItem(line, fallback.lines[index])) : fallback.lines,
  }
}

export function mapSubscription(raw: unknown, fallback: SubscriptionDetailData): SubscriptionDetailData {
  const record = asRecord(unwrap(raw))
  const recurring = pickArray(record, ['recurring', 'recurringLines', 'subscriptionLines'])
  const oneTime = pickArray(record, ['oneTime', 'oneTimeLines', 'orderLines'])
  return {
    ...fallback,
    id: pickString(record, ['id', 'subscriptionId'], fallback.id),
    number: pickString(record, ['number', 'subscriptionNumber'], fallback.number),
    customer: pickString(record, ['customer', 'customerName'], fallback.customer),
    status: pickString(record, ['status'], fallback.status),
    started: pickString(record, ['started', 'startDate', 'startedAt'], fallback.started),
    nextBilling: pickString(record, ['nextBilling', 'nextBillingDate', 'renewsOn'], fallback.nextBilling),
    recurring: recurring.length ? recurring.map((line, index) => mapBillingItem(line, fallback.recurring[index])) : fallback.recurring,
    oneTime: oneTime.length ? oneTime.map((line, index) => mapBillingItem(line, fallback.oneTime[index])) : fallback.oneTime,
  }
}

export function mapReports(raw: unknown, fallback: ReportsData): ReportsData {
  const record = asRecord(unwrap(raw))
  const kpis = asRecord(record.kpis ?? record.metrics ?? record)
  const velocityRaw = pickArray(record, ['quoteVelocity', 'velocity', 'chart'])
  return {
    quotesCreated: pickString(kpis, ['quotesCreated', 'quotesCreatedValue'], fallback.quotesCreated),
    quotesCreatedDetail: pickString(kpis, ['quotesCreatedDetail'], fallback.quotesCreatedDetail),
    avgApprovalTime: pickString(kpis, ['avgApprovalTime', 'averageApprovalTime'], fallback.avgApprovalTime),
    avgApprovalTimeDetail: pickString(kpis, ['avgApprovalTimeDetail'], fallback.avgApprovalTimeDetail),
    topUpsell: pickString(kpis, ['topUpsell', 'topUpsellProduct'], fallback.topUpsell),
    topUpsellDetail: pickString(kpis, ['topUpsellDetail'], fallback.topUpsellDetail),
    winRate: pickString(kpis, ['winRate'], fallback.winRate),
    winRateDetail: pickString(kpis, ['winRateDetail'], fallback.winRateDetail),
    quoteVelocity: velocityRaw.length
      ? velocityRaw.map((row, index) => {
          const item = asRecord(row)
          return {
            w: pickString(item, ['w', 'week', 'label', 'period'], fallback.quoteVelocity[index]?.w ?? `W${index + 1}`),
            created: pickNumber(item, ['created', 'quotesCreated'], fallback.quoteVelocity[index]?.created ?? 0),
            approved: pickNumber(item, ['approved', 'quotesApproved'], fallback.quoteVelocity[index]?.approved ?? 0),
          }
        })
      : fallback.quoteVelocity,
  }
}
