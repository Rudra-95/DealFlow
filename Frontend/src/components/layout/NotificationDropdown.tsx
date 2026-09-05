import { AlertCircle, Bell, CheckCircle2, RefreshCw, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export interface Notification {
  id: string
  title: string
  detail: string
  time: string
  tone: 'green' | 'amber' | 'blue' | 'coral'
  href: string
  read: boolean
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n-1', title: 'Approval requested', detail: 'Q-1048 · Northstar Labs · 18% discount', time: '12m ago', tone: 'amber', href: '/approvals/q-1048', read: false },
  { id: 'n-2', title: 'Quote approved', detail: 'Q-1047 · Harbor & Pine · Jordan Lee', time: '1h ago', tone: 'green', href: '/quotations/q-1047', read: false },
  { id: 'n-3', title: 'Deal health alert', detail: 'Veridian Health · No activity in 9 days', time: '3h ago', tone: 'coral', href: '/deal-health', read: false },
  { id: 'n-4', title: 'New recommendation', detail: 'Care Plan added to Q-1045 automatically', time: '5h ago', tone: 'blue', href: '/quotations/q-1045', read: true },
]

const toneIcons = {
  green: CheckCircle2,
  amber: AlertCircle,
  blue: Sparkles,
  coral: RefreshCw,
}

export function NotificationDropdown() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(DEMO_NOTIFICATIONS)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notes.filter((n) => !n.read).length

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

  function markAllRead() {
    setNotes((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function handleClick(note: Notification) {
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, read: true } : n))
    setOpen(false)
    navigate(note.href)
  }

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button
        id="notifications-button"
        className={`icon-button notification ${open ? 'icon-active' : ''}`}
        onClick={() => { setOpen(!open); if (!open) markAllRead() }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell size={19} />
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      {open && (
        <div className="dropdown notif-dropdown" role="dialog" aria-label="Notifications">
          <div className="dropdown-header">
            <strong>Notifications</strong>
            {unread > 0 && <button className="dropdown-action" onClick={markAllRead}>Mark all read</button>}
            <button className="dropdown-close" onClick={() => setOpen(false)} aria-label="Close"><X size={14} /></button>
          </div>

          <div className="notif-list">
            {notes.map((note) => {
              const Icon = toneIcons[note.tone]
              return (
                <button
                  key={note.id}
                  className={`notif-item ${note.read ? 'notif-read' : ''}`}
                  onClick={() => handleClick(note)}
                >
                  <div className={`notif-icon tone-${note.tone}`}><Icon size={13} /></div>
                  <div className="notif-body">
                    <strong>{note.title}</strong>
                    <span>{note.detail}</span>
                  </div>
                  <time>{note.time}</time>
                  {!note.read && <span className="notif-dot" />}
                </button>
              )
            })}
          </div>

          <div className="dropdown-footer">
            <button className="dropdown-action" onClick={() => setOpen(false)}>
              View all activity →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
