import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
  warn: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = icons[toast.variant]
  return (
    <div className={`toast toast-${toast.variant}`} role="alert">
      <Icon size={15} className="toast-icon" />
      <span>{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)} aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => [...prev.slice(-4), { id, message, variant }])
    const timer = setTimeout(() => remove(id), 4200)
    timers.current.set(id, timer)
  }, [remove])

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast])
  const error = useCallback((msg: string) => toast(msg, 'error'), [toast])
  const warn = useCallback((msg: string) => toast(msg, 'warning'), [toast])
  const info = useCallback((msg: string) => toast(msg, 'info'), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warn, info }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
