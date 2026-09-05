import {
  Activity,
  Boxes,
  Building2,
  ChevronRight,
  FileCheck2,
  FileText,
  Grid2X2,
  Menu,
  Package,
  Receipt,
  Repeat2,
  Settings2,
  TrendingUp,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { serviceMode } from '../../api/client'
import { navGroups } from '../../data'
import { HelpModal } from './HelpModal'
import { NotificationDropdown } from './NotificationDropdown'
import { UserDropdown } from './UserDropdown'

const icons = {
  grid: Grid2X2,
  file: FileText,
  check: FileCheck2,
  pulse: Activity,
  boxes: Boxes,
  repeat: Repeat2,
  receipt: Receipt,
  chart: TrendingUp,
  package: Package,
}

function NavIcon({ name }: { name: keyof typeof icons }) {
  const Icon = icons[name]
  return <Icon size={16} strokeWidth={1.8} />
}

function useBreadcrumb() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)
  if (parts.length === 0) return [{ label: 'Dashboard', href: '/dashboard' }]

  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    quotations: 'Quotations',
    approvals: 'Approvals',
    fulfillment: 'Fulfillment',
    subscriptions: 'Subscriptions',
    invoices: 'Invoices',
    'deal-health': 'Deal Health',
    reports: 'Reports',
    products: 'Products',
    admin: 'Admin',
    'discount-rules': 'Discount Rules',
    customer: 'Portal',
    quotation: 'My Quotation',
    messages: 'Messages',
    profile: 'Profile',
  }

  return parts.map((part, i) => ({
    label: labelMap[part] ?? `#${part.replace(/^[a-z]-/, '').toUpperCase()}`,
    href: '/' + parts.slice(0, i + 1).join('/'),
  }))
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const breadcrumb = useBreadcrumb()

  const isCustomer = user?.role === 'Customer'

  function handleUserMenuClick() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Brand / Logo — clickable */}
        <Link
          to={isCustomer ? '/customer/quotation' : '/dashboard'}
          className="brand brand-link"
          onClick={() => setMobileOpen(false)}
          aria-label="DealFlow360 home"
        >
          <div className="brand-mark">D<span>3</span>6</div>
          <div>
            <strong>DealFlow</strong><small>360</small>
          </div>
          <button className="mobile-close" onClick={(e) => { e.preventDefault(); setMobileOpen(false) }} aria-label="Close menu">
            <X size={18} />
          </button>
        </Link>

        {/* Workspace indicator — redesigned */}
        <div className="workspace-block">
          <div className="workspace-icon">
            <Building2 size={14} />
          </div>
          <div className="workspace-info">
            <strong>{user?.company ?? 'DealFlow360 HQ'}</strong>
            <small className="workspace-role">
              <span className={`role-pip role-${(user?.role ?? 'Sales Manager').toLowerCase().replace(' ', '-')}`} />
              {user?.role ?? 'Sales Manager'}
            </small>
          </div>
        </div>

        {/* Navigation */}
        {isCustomer ? (
          <nav className="nav">
            <div className="nav-label">Customer portal</div>
            {[
              ['My quotation', '/customer/quotation', 'file'],
              ['Messages', '/customer/messages', 'pulse'],
              ['Profile', '/customer/profile', 'grid'],
            ].map(([label, path, icon]) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <NavIcon name={icon as keyof typeof icons} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        ) : (
          <nav className="nav">
            {navGroups.map((group) => (
              <div className="nav-group" key={group.label}>
                <div className="nav-label">{group.label}</div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  >
                    <NavIcon name={item.icon as keyof typeof icons} />
                    <span>{item.label}</span>
                    {item.label === 'Approvals' && <span className="nav-count">2</span>}
                    {item.label === 'Deal health' && <span className="nav-count nav-count-alert">4</span>}
                  </NavLink>
                ))}
              </div>
            ))}
            {user?.role === 'Admin' && (
              <NavLink to="/admin/discount-rules" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Settings2 size={16} />
                <span>Admin settings</span>
              </NavLink>
            )}
          </nav>
        )}

        {/* Sidebar bottom — service status + user */}
        <div className="sidebar-bottom">
          <div className="service-note">
            <span className="live-dot" />
            {serviceMode}
            <small>Ready for backend connection</small>
          </div>

          {/* User menu — click to sign out */}
          <button
            className="user-menu"
            onClick={handleUserMenuClick}
            title="Click to sign out"
            aria-label="Sign out"
          >
            <div className="avatar">{user?.initials ?? 'MC'}</div>
            <div>
              <strong>{user?.name ?? 'Maya Chen'}</strong>
              <small>{user?.role ?? 'Sales Manager'}</small>
            </div>
            <ChevronRight size={14} className="user-chevron" />
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="main">
        <header className="topbar">
          <button className="icon-button menu-trigger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <nav className="crumb" aria-label="Breadcrumb">
            <Link to={isCustomer ? '/customer/quotation' : '/dashboard'} className="crumb-home">
              DealFlow360
            </Link>
            {breadcrumb.map((crumb, i) => (
              <span key={crumb.href} className="crumb-segment">
                <ChevronRight size={13} className="crumb-sep" />
                {i === breadcrumb.length - 1 ? (
                  <strong>{crumb.label}</strong>
                ) : (
                  <Link to={crumb.href}>{crumb.label}</Link>
                )}
              </span>
            ))}
          </nav>

          {/* Top-right actions */}
          <div className="top-actions">
            <HelpModal />
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden />
      )}
    </div>
  )
}
