import { AlertCircle, ArrowUpRight, CheckCircle2, FileText, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { quotes } from '../../data'
import { useDashboard } from '../../services/dashboardService'

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function Button({ children, icon, onClick }: { children: React.ReactNode; icon?: React.ReactNode; onClick?: () => void }) {
  return <button className="button button-primary" onClick={onClick}>{icon}{children}</button>
}

function Status({ children, tone }: { children: string; tone: string }) {
  return <span className={`status status-${tone}`}><span className="status-dot" />{children}</span>
}

function ActivityIcon({ tone }: { tone: string }) {
  const icons = { green: CheckCircle2, amber: AlertCircle, blue: Sparkles, purple: RefreshCw }
  const Icon = icons[tone as keyof typeof icons] ?? FileText
  return <div className={`activity-icon ${tone}`}><Icon /></div>
}

function Metric({ label, value, detail, tone, to }: { label: string; value: string; detail: string; tone: string; to?: string }) {
  const card = (
    <div className={`metric-card metric-${tone}`}>
      <div className="metric-top"><span>{label}</span><ArrowUpRight size={16} /></div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
  return to ? <Link to={to} className="metric-link">{card}</Link> : card
}

export function Dashboard() {
  const { data, isLoading, error } = useDashboard()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (isLoading) return <div className="dashboard-state">Loading your sales pulse...</div>
  if (error) return <div className="dashboard-state dashboard-error">{error}</div>

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <div className="eyebrow">{todayLabel()}</div>
          <h1>{greeting()}, {user?.name?.split(' ')[0] ?? 'there'}</h1>
          <p>Here's the pulse of your revenue engine.</p>
        </div>
        <div className="dashboard-hero-actions">
          <Link className="dashboard-text-link" to="/approvals">
            View approvals <ArrowUpRight size={15} />
          </Link>
          <Button icon={<Plus size={17} />} onClick={() => navigate('/quotations/q-new')}>
            New quotation
          </Button>
        </div>
      </div>

      <section className="metric-grid dashboard-metrics">
        <Metric label="Pipeline value" value={money(data.pipelineValue)} detail="↑ 12.8% from last month" tone="navy" />
        <Metric label="Pending approvals" value={String(data.pendingApprovals)} detail="3 need your attention today" tone="amber" to="/approvals" />
        <Metric label="Open quotations" value={String(data.openQuotations)} detail="7 updated in the last 24h" tone="blue" to="/quotations" />
        <Metric label="At-risk deals" value={String(data.atRiskDeals)} detail="$128k needs a nudge" tone="coral" to="/deal-health" />
      </section>

      <div className="dashboard-grid">
        <section className="panel chart-panel dashboard-revenue">
          <div className="panel-heading">
            <div>
              <h2>Revenue outlook</h2>
              <p>Closed won and weighted pipeline</p>
            </div>
            <span className="chart-period">Last 6 months</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend}>
                <defs>
                  <linearGradient id="dashboard-pipeline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5c9e" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#7c5c9e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ebe5dd" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}k`} />
                <Tooltip formatter={(v) => [`$${v}k`]} />
                <Area type="monotone" dataKey="pipeline" stroke="#7c5c9e" fill="url(#dashboard-pipeline)" strokeWidth={2} />
                <Area type="monotone" dataKey="won" stroke="#4338ca" fill="none" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            <span><i className="legend-navy" />Closed won</span>
            <span><i className="legend-blue" />Weighted pipeline</span>
            <span className="chart-note">Values shown in USD thousands</span>
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div><h2>Recent activity</h2><p>Latest movement across your workspace</p></div>
            <Link to="/quotations" className="text-link">View all <ArrowUpRight size={14} /></Link>
          </div>
          {data.recentActivity.map((activity) => (
            <Link className="activity activity-link" to={activity.href ?? '/dashboard'} key={activity.id}>
              <ActivityIcon tone={activity.tone} />
              <div><strong>{activity.title}</strong><span>{activity.detail}</span></div>
              <time>{activity.time}</time>
            </Link>
          ))}
        </section>
      </div>

      <section className="panel dashboard-attention">
        <div className="panel-heading">
          <div><h2>Deals needing attention</h2><p>Stay ahead of the next best action.</p></div>
          <Link to="/deal-health" className="text-link">Open deal health <ArrowUpRight size={14} /></Link>
        </div>
        {quotes.slice(0, 3).map((quote, index) => (
          <Link className="deal-row" to={`/quotations/${quote.id}`} key={quote.id}>
            <div className="deal-avatar">{quote.customer.slice(0, 2)}</div>
            <div className="deal-info">
              <strong>{quote.customer}</strong>
              <span>{quote.number} · {['Discount is 6% above Gold tier ceiling', 'No customer activity in 9 days', 'Delivery date moved twice'][index]}</span>
            </div>
            <Status tone={quote.risk === 'High' ? 'high' : quote.risk.toLowerCase()}>
              {quote.risk}
            </Status>
            <strong className="row-total">{money(quote.total)}</strong>
            <ArrowUpRight size={16} />
          </Link>
        ))}
      </section>
    </div>
  )
}