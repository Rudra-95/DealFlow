import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiClient } from '../api/client'
import { mapSubscription } from '../api/map'
import { subscriptionsApi } from '../api/subscriptions'
import type { SubscriptionDetailData } from '../api/types'
import { Back, BillingLine, Button, PageHeader } from '../components/shared'
import { useToast } from '../contexts/ToastContext'
import { money } from '../utils/format'

const DEMO_SUBSCRIPTIONS: Record<string, SubscriptionDetailData> = {
  'sub-1': {
    id: 'sub-1',
    number: 'SUB-001',
    customer: 'Northstar Labs',
    status: 'Active',
    started: 'September 18, 2025',
    nextBilling: 'September 18, 2027',
    recurring: [
      { name: 'Observability Suite', detail: 'Annual · OBS-01', amount: 5400 },
      { name: 'Care Plan', detail: 'Annual · CARE-12', amount: 1200 },
    ],
    oneTime: [
      { name: 'Edge Gateway Pro', detail: '12 × $2,400', amount: 28800 },
      { name: 'Implementation Services', detail: 'SERV-20', amount: 8740 },
    ],
  },
}

const DEFAULT_SUB = DEMO_SUBSCRIPTIONS['sub-1']

export function SubscriptionDetail() {
  const { id = 'sub-1' } = useParams()
  const fallback = useMemo(
    () => DEMO_SUBSCRIPTIONS[id] ?? { ...DEFAULT_SUB, id },
    [id],
  )
  const [saving, setSaving] = useState(false)
  const [subscription, setSubscription] = useState(fallback)
  const [loadedId, setLoadedId] = useState(id)
  const { success, error } = useToast()

  if (loadedId !== id) {
    setSubscription(fallback)
    setLoadedId(id)
  }

  useEffect(() => {
    if (!apiClient.baseUrl) return
    subscriptionsApi.get(id).then((remote) => setSubscription(mapSubscription(remote, fallback))).catch(() => undefined)
  }, [id, fallback])

  async function update(status: 'Active' | 'Cancelled') {
    if (saving) return
    setSaving(true)
    try {
      if (apiClient.baseUrl) {
        const remote = await subscriptionsApi.update(subscription.id, { status })
        setSubscription(mapSubscription(remote, { ...subscription, status }))
      } else {
        setSubscription((prev) => ({ ...prev, status }))
      }
      success(apiClient.baseUrl ? `Subscription ${status.toLowerCase()}.` : `Subscription ${status.toLowerCase()} in demo mode.`)
    } catch {
      error('Subscription could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  const cancelled = subscription.status === 'Cancelled'

  return (
    <>
      <Back to="/subscriptions" label="Back to subscriptions" />
      <PageHeader
        eyebrow={`Subscription · ${subscription.number}`}
        title={subscription.customer}
        description={`${subscription.status} since ${subscription.started}`}
        action={
          <div className="header-actions">
            <Button variant="secondary" disabled={saving} onClick={() => void update('Active')}>
              {saving ? 'Saving…' : 'Modify'}
            </Button>
            <Button variant="danger" disabled={saving || cancelled} onClick={() => void update('Cancelled')}>
              Cancel subscription
            </Button>
          </div>
        }
      />
      <div className="billing-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recurring lines</h2>
              <p>Next billing date: {subscription.nextBilling}</p>
            </div>
          </div>
          {subscription.recurring.map((line) => (
            <BillingLine key={line.name} name={line.name} detail={line.detail} amount={money(line.amount)} />
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>One-time lines</h2>
              <p>Charged on order confirmation</p>
            </div>
          </div>
          {subscription.oneTime.map((line) => (
            <BillingLine key={line.name} name={line.name} detail={line.detail} amount={money(line.amount)} />
          ))}
        </section>
      </div>
    </>
  )
}
