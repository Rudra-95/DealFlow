import { ChevronRight, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, PageHeader, StatusBadge, Table } from '../components/shared'
import { quotes } from '../data'
import { money } from '../utils/format'
import type { Status } from '../data'

const STATUS_FILTERS: Array<{ label: string; value: Status | 'All' }> = [
  { label: 'All', value: 'All' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'At risk', value: 'At risk' },
]

export function Quotations() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All')
  const navigate = useNavigate()

  const visible = quotes.filter((q) => {
    const matchesSearch = `${q.customer} ${q.number} ${q.owner}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <>
      <PageHeader
        eyebrow="Workspace / Quotations"
        title="Quotations"
        description="Build, negotiate and move every deal forward."
        action={<Button icon={<Plus size={17} />} onClick={() => navigate('/quotations/q-new')}>New quotation</Button>}
      />

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <Search size={14} className="search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, quote number or owner..."
          />
        </div>
        <button className="filter-button"><SlidersHorizontal size={13} /> Filters</button>
        <div className="status-filter-tabs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`status-tab ${statusFilter === f.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
              <span className="status-tab-count">
                {f.value === 'All' ? quotes.length : quotes.filter((q) => q.status === f.value).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <th>Quotation</th>
            <th>Customer</th>
            <th>Owner</th>
            <th>Total</th>
            <th>Updated</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={7} className="table-empty">
                No quotations match your search or filter.
              </td>
            </tr>
          ) : (
            visible.map((quote) => (
              <tr key={quote.id} onClick={() => navigate(`/quotations/${quote.id}`)}>
                <td>
                  <strong>{quote.number}</strong>
                  <span className="table-muted">{quote.lines.length} line items</span>
                </td>
                <td>{quote.customer}</td>
                <td>{quote.owner}</td>
                <td><strong>{money(quote.total)}</strong></td>
                <td className="table-muted">{quote.updated}</td>
                <td><StatusBadge status={quote.status} /></td>
                <td><ChevronRight size={17} /></td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  )
}
