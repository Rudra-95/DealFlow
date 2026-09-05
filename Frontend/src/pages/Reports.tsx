import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiClient } from '../api/client'
import { mapReports } from '../api/map'
import { reportsApi } from '../api/reports'
import type { ReportsData } from '../api/types'
import { Button, MetricCard, PageHeader } from '../components/shared'
import { useToast } from '../contexts/ToastContext'

const DEMO_REPORTS: ReportsData = {
  quotesCreated: '86',
  quotesCreatedDetail: '↑ 18% vs prior period',
  avgApprovalTime: '9.4h',
  avgApprovalTimeDetail: '↓ 2.1h vs prior period',
  topUpsell: 'Care Plan',
  topUpsellDetail: 'Added to 34% of quotes',
  winRate: '42.8%',
  winRateDetail: '↑ 4.6% vs prior period',
  quoteVelocity: [
    { w: 'Aug 05', created: 12, approved: 8 },
    { w: 'Aug 12', created: 18, approved: 12 },
    { w: 'Aug 19', created: 15, approved: 11 },
    { w: 'Aug 26', created: 24, approved: 17 },
    { w: 'Sep 02', created: 17, approved: 13 },
  ],
}

export function Reports() {
  const { info } = useToast()
  const [period, setPeriod] = useState('last-30-days')
  const [team, setTeam] = useState('all')
  const [approvalStatus, setApprovalStatus] = useState('all')
  const [product, setProduct] = useState('all')
  const [report, setReport] = useState(DEMO_REPORTS)

  useEffect(() => {
    if (!apiClient.baseUrl) return
    const query = new URLSearchParams({ period, team, approvalStatus, product }).toString()
    reportsApi.get(query).then((remote) => setReport(mapReports(remote, DEMO_REPORTS))).catch(() => undefined)
  }, [period, team, approvalStatus, product])

  return (
    <>
      <PageHeader
        eyebrow="Insights / Reports"
        title="Revenue intelligence"
        description="A clear view of how the operating system is performing."
        action={
          <div className="header-actions">
            <Button variant="secondary" icon={<Download size={16} />} onClick={() => info('Export stays on this page. No export endpoint is configured.')}>Export XLS</Button>
            <Button icon={<Download size={16} />} onClick={() => info('Export stays on this page. No export endpoint is configured.')}>Export PDF</Button>
          </div>
        }
      />
      <div className="filters-row">
        <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Period">
          <option value="last-30-days">Last 30 days</option>
          <option value="last-90-days">Last 90 days</option>
          <option value="this-year">This year</option>
        </select>
        <select value={team} onChange={(event) => setTeam(event.target.value)} aria-label="Sales team">
          <option value="all">All sales teams</option>
          <option value="enterprise">Enterprise</option>
          <option value="mid-market">Mid-market</option>
        </select>
        <select value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value)} aria-label="Approval status">
          <option value="all">All approval statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={product} onChange={(event) => setProduct(event.target.value)} aria-label="Product">
          <option value="all">All products</option>
          <option value="hardware">Hardware</option>
          <option value="services">Services</option>
        </select>
      </div>
      <section className="metric-grid">
        <MetricCard label="Quotes created" value={report.quotesCreated} detail={report.quotesCreatedDetail} tone="navy" />
        <MetricCard label="Avg. approval time" value={report.avgApprovalTime} detail={report.avgApprovalTimeDetail} tone="green" />
        <MetricCard label="Top upsell" value={report.topUpsell} detail={report.topUpsellDetail} tone="blue" />
        <MetricCard label="Win rate" value={report.winRate} detail={report.winRateDetail} tone="amber" />
      </section>
      <section className="panel chart-panel report-chart">
        <div className="panel-heading">
          <div>
            <h2>Quote velocity</h2>
            <p>Created, approved and won quotes over time</p>
          </div>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.quoteVelocity}>
              <CartesianGrid stroke="#e8edf3" vertical={false} />
              <XAxis dataKey="w" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="created" fill="#b7c9e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approved" fill="#173c66" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  )
}
