import { Building2, Check, Mail, Phone, Save, User2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader } from '../components/shared'

export function CustomerProfile() {
  const { user } = useAuth()
  const { success } = useToast()

  const [form, setForm] = useState({
    name: user?.name ?? 'Olivia Carter',
    email: user?.email ?? 'olivia@northstarlabs.com',
    phone: '+1 (415) 555-0192',
    company: user?.company ?? 'Northstar Labs',
    title: 'Head of Procurement',
    address: '1420 Harbor Blvd, San Francisco, CA 94105',
  })
  const [saving, setSaving] = useState(false)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    success('Profile updated successfully.')
  }

  return (
    <>
      <PageHeader
        eyebrow="Customer portal / Profile"
        title="My profile"
        description="Manage your account details and contact information."
      />

      <div className="profile-grid">
        {/* Identity card */}
        <aside className="panel profile-card">
          <div className="profile-hero">
            <div className="profile-avatar-lg">{user?.initials ?? 'OC'}</div>
            <div>
              <h2>{form.name}</h2>
              <p>{form.title}</p>
              <span className="user-role-badge">{user?.role ?? 'Customer'}</span>
            </div>
          </div>
          <div className="profile-meta">
            <div className="profile-meta-row"><Mail size={13} /><span>{form.email}</span></div>
            <div className="profile-meta-row"><Phone size={13} /><span>{form.phone}</span></div>
            <div className="profile-meta-row"><Building2 size={13} /><span>{form.company}</span></div>
          </div>
          <div className="profile-history">
            <div className="history-label">Quotation history</div>
            {[
              { ref: 'Q-1048', status: 'Under review', amount: '$42,860' },
              { ref: 'Q-1039', status: 'Confirmed', amount: '$18,400' },
              { ref: 'Q-1021', status: 'Paid', amount: '$9,750' },
            ].map((q) => (
              <div key={q.ref} className="history-row">
                <strong>{q.ref}</strong>
                <span className={`status status-${q.status.toLowerCase().replace(' ', '-')}`}>
                  <span className="status-dot" />{q.status}
                </span>
                <b>{q.amount}</b>
              </div>
            ))}
          </div>
        </aside>

        {/* Edit form */}
        <section className="panel profile-form-panel">
          <div className="panel-heading">
            <div>
              <h2>Account details</h2>
              <p>Update your personal and company information.</p>
            </div>
          </div>
          <form onSubmit={handleSave} className="profile-form">
            <div className="form-row-2">
              <label>
                <span><User2 size={12} /> Full name</span>
                <input type="text" value={form.name} onChange={update('name')} />
              </label>
              <label>
                <span><Mail size={12} /> Email</span>
                <input type="email" value={form.email} onChange={update('email')} />
              </label>
            </div>
            <div className="form-row-2">
              <label>
                <span><Phone size={12} /> Phone</span>
                <input type="tel" value={form.phone} onChange={update('phone')} />
              </label>
              <label>
                <span>Job title</span>
                <input type="text" value={form.title} onChange={update('title')} />
              </label>
            </div>
            <label>
              <span><Building2 size={12} /> Company</span>
              <input type="text" value={form.company} onChange={update('company')} />
            </label>
            <label>
              <span>Billing address</span>
              <input type="text" value={form.address} onChange={update('address')} />
            </label>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={saving}>
                {saving ? <><Save size={14} className="spin" /> Saving...</> : <><Check size={14} /> Save changes</>}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
