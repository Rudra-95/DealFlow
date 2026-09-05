import { ChevronRight, LogOut, Settings2, User2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function UserDropdown() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('keydown', handleKey) }
  }, [])

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/login')
  }

  if (!user) return null

  const isCustomer = user.role === 'Customer'

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button
        id="user-avatar-button"
        className={`top-avatar ${open ? 'avatar-active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="User menu"
        aria-expanded={open}
      >
        {user.initials}
      </button>

      {open && (
        <div className="dropdown user-dropdown" role="dialog" aria-label="User menu">
          <div className="dropdown-header">
            <strong>Account</strong>
            <button className="dropdown-close" onClick={() => setOpen(false)} aria-label="Close"><X size={14} /></button>
          </div>

          <div className="user-info-panel">
            <div className="user-info-avatar">{user.initials}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <span className="user-role-badge">{user.role}</span>
            </div>
          </div>

          <div className="dropdown-menu">
            {!isCustomer && (
              <button className="dropdown-item" onClick={() => { setOpen(false); navigate('/dashboard') }}>
                <User2 size={14} />
                <span>My profile</span>
                <ChevronRight size={12} className="item-arrow" />
              </button>
            )}
            {isCustomer && (
              <button className="dropdown-item" onClick={() => { setOpen(false); navigate('/customer/profile') }}>
                <User2 size={14} />
                <span>My profile</span>
                <ChevronRight size={12} className="item-arrow" />
              </button>
            )}
            {user.role === 'Admin' && (
              <button className="dropdown-item" onClick={() => { setOpen(false); navigate('/admin/discount-rules') }}>
                <Settings2 size={14} />
                <span>Admin settings</span>
                <ChevronRight size={12} className="item-arrow" />
              </button>
            )}
          </div>

          <div className="dropdown-divider" />

          <div className="dropdown-menu">
            <button className="dropdown-item danger" onClick={handleLogout}>
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
