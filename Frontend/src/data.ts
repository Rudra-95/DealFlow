export type Role = 'Admin' | 'Sales Manager' | 'Salesperson' | 'Customer'

export type Status = 'Approved' | 'Pending' | 'Returned' | 'Rejected' | 'Draft' | 'At risk' | 'Active' | 'Paused' | 'Cancelled' | 'Paid' | 'Unpaid' | 'Overdue' | 'Fulfilled' | 'Backorder' | 'Split pending'

export interface QuoteLine {
  id: string
  product: string
  sku: string
  quantity: number
  price: number
  discount: number
  maxDiscount: number
  recurring?: boolean
}

export interface Quote {
  id: string
  number: string
  customer: string
  owner: string
  status: Status
  total: number
  updated: string
  risk: 'Low' | 'Medium' | 'High'
  lines: QuoteLine[]
}

export const quotes: Quote[] = [
  { id: 'q-1048', number: 'Q-1048', customer: 'Northstar Labs', owner: 'Maya Chen', status: 'Pending', total: 42860, updated: '12 min ago', risk: 'High', lines: [{ id: 'l1', product: 'Edge Gateway Pro', sku: 'EG-400', quantity: 12, price: 2400, discount: 18, maxDiscount: 12 }, { id: 'l2', product: 'Observability Suite', sku: 'OBS-01', quantity: 1, price: 5400, discount: 10, maxDiscount: 10, recurring: true }, { id: 'l3', product: 'Implementation Services', sku: 'SERV-20', quantity: 1, price: 9200, discount: 5, maxDiscount: 10 }] },
  { id: 'q-1047', number: 'Q-1047', customer: 'Harbor & Pine', owner: 'Jordan Lee', status: 'Approved', total: 18640, updated: '1 hr ago', risk: 'Low', lines: [{ id: 'l4', product: 'Signal Router', sku: 'SR-200', quantity: 4, price: 3100, discount: 8, maxDiscount: 10 }] },
  { id: 'q-1046', number: 'Q-1046', customer: 'Veridian Health', owner: 'Maya Chen', status: 'At risk', total: 72300, updated: 'Yesterday', risk: 'High', lines: [{ id: 'l5', product: 'Edge Gateway Pro', sku: 'EG-400', quantity: 24, price: 2400, discount: 15, maxDiscount: 12 }] },
  { id: 'q-1045', number: 'Q-1045', customer: 'Tandem Retail', owner: 'Avery Smith', status: 'Draft', total: 12400, updated: 'Yesterday', risk: 'Medium', lines: [{ id: 'l6', product: 'Signal Router', sku: 'SR-200', quantity: 4, price: 3100, discount: 0, maxDiscount: 10 }] },
  { id: 'q-1044', number: 'Q-1044', customer: 'Atlas Freight', owner: 'Jordan Lee', status: 'Approved', total: 38900, updated: '2 days ago', risk: 'Low', lines: [{ id: 'l7', product: 'Fleet Beacon', sku: 'FB-100', quantity: 10, price: 4200, discount: 7, maxDiscount: 10 }] },
]

export const products = [
  { id: 'p-1', name: 'Edge Gateway Pro', category: 'Hardware', sku: 'EG-400', price: 2400, unit: 'Each', tax: '18%', stock: 164, status: 'Active', description: 'Secure edge compute for distributed operations.', recurring: false },
  { id: 'p-2', name: 'Observability Suite', category: 'Services', sku: 'OBS-01', price: 5400, unit: 'Annual', tax: '0%', stock: 999, status: 'Active', description: 'Live health signals, anomaly detection, and executive reporting.', recurring: true },
  { id: 'p-3', name: 'Signal Router', category: 'Hardware', sku: 'SR-200', price: 3100, unit: 'Each', tax: '18%', stock: 48, status: 'Active', description: 'Intelligent routing for multi-site fulfillment.', recurring: false },
  { id: 'p-4', name: 'Fleet Beacon', category: 'Hardware', sku: 'FB-100', price: 4200, unit: 'Each', tax: '18%', stock: 72, status: 'Active', description: 'Asset-level tracking for field operations.', recurring: false },
  { id: 'p-5', name: 'Care Plan', category: 'Services', sku: 'CARE-12', price: 1200, unit: 'Annual', tax: '0%', stock: 999, status: 'Active', description: 'Priority response and quarterly success reviews.', recurring: true },
]

export const approvals = quotes.filter((quote) => quote.status === 'Pending' || quote.status === 'At risk')
export const navGroups = [
  { label: 'Workspace', items: [{ label: 'Overview', path: '/dashboard', icon: 'grid' }, { label: 'Quotations', path: '/quotations', icon: 'file' }, { label: 'Approvals', path: '/approvals', icon: 'check' }, { label: 'Deal health', path: '/deal-health', icon: 'pulse' }] },
  { label: 'Operations', items: [{ label: 'Fulfillment', path: '/fulfillment', icon: 'boxes' }, { label: 'Subscriptions', path: '/subscriptions', icon: 'repeat' }, { label: 'Invoices', path: '/invoices', icon: 'receipt' }] },
  { label: 'Insights', items: [{ label: 'Reports', path: '/reports', icon: 'chart' }, { label: 'Products', path: '/products', icon: 'package' }] },
]

export const recommendations = [
  { name: 'Care Plan', reason: 'Customers with Edge Gateway Pro convert 42% more often with support coverage.', price: 1200, productId: 'p-5' },
  { name: 'Signal Router', reason: 'Frequently paired with distributed gateway deployments.', price: 3100, productId: 'p-3' },
  { name: 'Observability Suite', reason: 'Give the operations team a live view of this rollout.', price: 5400, productId: 'p-2' },
]