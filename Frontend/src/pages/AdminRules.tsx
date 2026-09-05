import { Check, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button, PageHeader, StatusBadge } from '../components/shared'
import { useToast } from '../contexts/ToastContext'

const DEFAULT_TIERS = [
  { tier: 'Bronze', label: 'Customer pricing tier', value: '5' },
  { tier: 'Silver', label: 'Customer pricing tier', value: '10' },
  { tier: 'Gold', label: 'Customer pricing tier', value: '15' },
]

const DEFAULT_CATEGORIES = [
  { name: 'Hardware', label: 'Product category', value: '15' },
  { name: 'Services', label: 'Product category', value: '10' },
  { name: 'Licensing', label: 'Product category', value: '8' },
]

const APPROVAL_RULES = [
  { condition: 'Within limit', route: 'No approval required', status: 'Approved' as const },
  { condition: 'Over limit + medium risk', route: 'Sales Manager review', status: 'Pending' as const },
  { condition: 'Over limit + high risk', route: 'Sales Manager → Finance', status: 'At risk' as const },
]

export function AdminRules() {
  const { success } = useToast()
  const [tiers, setTiers] = useState(DEFAULT_TIERS)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [saving, setSaving] = useState(false)

  function updateTier(index: number, value: string) {
    setTiers((prev) => prev.map((t, i) => i === index ? { ...t, value } : t))
  }

  function updateCategory(index: number, value: string) {
    setCategories((prev) => prev.map((c, i) => i === index ? { ...c, value } : c))
  }

  function handleReset() {
    setTiers(DEFAULT_TIERS)
    setCategories(DEFAULT_CATEGORIES)
    success('Configuration reset to defaults.')
  }

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    success('Discount governance configuration saved. Backend will enforce these rules.')
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin / Configuration"
        title="Discount governance"
        description="Tune guardrails while the backend remains the source of truth."
        action={
          <div className="header-actions">
            <Button variant="secondary" icon={<RotateCcw size={14} />} onClick={handleReset}>
              Reset defaults
            </Button>
            <Button icon={<Check size={16} />} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save configuration'}
            </Button>
          </div>
        }
      />

      <form onSubmit={(e) => { e.preventDefault(); void handleSave() }}>
        <div className="config-grid">
          <section className="panel config-panel">
            <div className="panel-heading">
              <div>
                <h2>Tier discount ceilings</h2>
                <p>Maximum standard discount by customer tier.</p>
              </div>
            </div>
            {tiers.map((row, i) => (
              <div className="config-row" key={row.tier}>
                <div>
                  <strong>{row.tier}</strong>
                  <span>{row.label}</span>
                </div>
                <div className="config-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={row.value}
                    onChange={(e) => updateTier(i, e.target.value)}
                  />
                  <span className="config-unit">%</span>
                </div>
              </div>
            ))}
          </section>

          <section className="panel config-panel">
            <div className="panel-heading">
              <div>
                <h2>Category ceilings</h2>
                <p>Additional product-level guardrails.</p>
              </div>
            </div>
            {categories.map((row, i) => (
              <div className="config-row" key={row.name}>
                <div>
                  <strong>{row.name}</strong>
                  <span>{row.label}</span>
                </div>
                <div className="config-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={row.value}
                    onChange={(e) => updateCategory(i, e.target.value)}
                  />
                  <span className="config-unit">%</span>
                </div>
              </div>
            ))}
          </section>
        </div>

        <section className="panel rules-panel">
          <div className="panel-heading">
            <div>
              <h2>Approval routing</h2>
              <p>What happens when a discount crosses a threshold.</p>
            </div>
          </div>
          {APPROVAL_RULES.map((rule, index) => (
            <div className="rule" key={rule.condition}>
              <span className="rule-number">0{index + 1}</span>
              <div>
                <strong>{rule.condition}</strong>
                <p>{rule.route}</p>
              </div>
              <StatusBadge status={rule.status} />
            </div>
          ))}
        </section>
      </form>
    </>
  )
}
