import { ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, StatusBadge, Table } from '../components/shared'
import type { Status } from '../data'

const ROWS: Array<{ id: string; customer: string; amount: string; issued: string; due: string; status: Status }> = [
  { id: 'inv-2041', customer: 'Harbor & Pine', amount: '$18,640', issued: 'Aug 28, 2026', due: 'Sep 27, 2026', status: 'Paid' },
  { id: 'inv-2040', customer: 'Northstar Labs', amount: '$42,860', issued: 'Sep 01, 2026', due: 'Oct 01, 2026', status: 'Unpaid' },
  { id: 'inv-2038', customer: 'Veridian Health', amount: '$72,300', issued: 'Aug 02, 2026', due: 'Sep 01, 2026', status: 'Overdue' },
]

const STATUS_TABS: Array<{ label: string; value: Status | 'All' }> = [
  { label: 'All', value: 'All' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Unpaid', value: 'Unpaid' },
  { label: 'Overdue', value: 'Overdue' },
]

export function Invoices() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All')

  const visible = ROWS.filter((r) => {
    const matchSearch = `${r.customer} ${r.id}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <>
      <PageHeader
        eyebrow="Operations / Invoices"
        title="Invoices"
        description="Keep payment moments clear and predictable."
      />

      <div className="toolbar">
        <div className="search">
          <Search size={14} className="search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices or customers..."
          />
        </div>
        <div className="status-filter-tabs">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              className={`status-tab ${statusFilter === t.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(t.value)}
            >
              {t.label}
              <span className="status-tab-count">
                {t.value === 'All' ? ROWS.length : ROWS.filter((r) => r.status === t.value).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Issued</th>
            <th>Due date</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr><td colSpan={7} className="table-empty">No invoices match your search.</td></tr>
          ) : (
            visible.map((row) => (
              <tr key={row.id} onClick={() => navigate(`/invoices/${row.id}`)}>
                <td><strong>{row.id.toUpperCase().replace('-', '-')}</strong></td>
                <td>{row.customer}</td>
                <td><strong>{row.amount}</strong></td>
                <td>{row.issued}</td>
                <td className={row.status === 'Overdue' ? 'text-danger' : ''}>{row.due}</td>
                <td><StatusBadge status={row.status} /></td>
                <td><ChevronRight size={17} /></td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  )
}
