import { BookOpen, ExternalLink, HelpCircle, Keyboard, LifeBuoy, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const SHORTCUTS = [
  { keys: ['G', 'D'], label: 'Go to Dashboard' },
  { keys: ['G', 'Q'], label: 'Go to Quotations' },
  { keys: ['G', 'A'], label: 'Go to Approvals' },
  { keys: ['G', 'H'], label: 'Go to Deal Health' },
  { keys: ['N', 'Q'], label: 'New Quotation' },
  { keys: ['Esc'], label: 'Close modal / dropdown' },
  { keys: ['?'], label: 'Open this help panel' },
]

const LINKS = [
  { icon: BookOpen, label: 'Documentation', href: '#', note: 'Guides and API reference' },
  { icon: LifeBuoy, label: 'Support', href: '#', note: 'Contact the DealFlow360 team' },
  { icon: ExternalLink, label: 'Backend API', href: '#', note: 'OpenAPI spec (coming soon)' },
]

export function HelpModal() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        id="help-button"
        className={`icon-button ${open ? 'icon-active' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Help and keyboard shortcuts"
      >
        <HelpCircle size={19} />
      </button>

      {open && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }} role="dialog" aria-modal aria-label="Help">
          <div className="modal help-modal" ref={ref}>
            <div className="modal-header">
              <div className="modal-title">
                <Keyboard size={16} />
                <strong>Help & Shortcuts</strong>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close help"><X size={16} /></button>
            </div>

            <div className="modal-body">
              <section className="help-section">
                <div className="help-section-label">Keyboard shortcuts</div>
                <div className="shortcuts-grid">
                  {SHORTCUTS.map((s) => (
                    <div className="shortcut-row" key={s.label}>
                      <div className="shortcut-keys">
                        {s.keys.map((k, i) => (
                          <span key={i}><kbd>{k}</kbd>{i < s.keys.length - 1 && <span className="then">then</span>}</span>
                        ))}
                      </div>
                      <span className="shortcut-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="help-section">
                <div className="help-section-label">Resources</div>
                <div className="help-links">
                  {LINKS.map((link) => {
                    const Icon = link.icon
                    return (
                      <a key={link.label} href={link.href} className="help-link" target="_blank" rel="noopener noreferrer">
                        <Icon size={15} />
                        <div>
                          <strong>{link.label}</strong>
                          <span>{link.note}</span>
                        </div>
                        <ExternalLink size={11} className="help-external" />
                      </a>
                    )
                  })}
                </div>
              </section>

              <div className="help-version">
                DealFlow360 v1.0.0-alpha · Hackathon Edition · Press <kbd>?</kbd> to toggle this panel
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
