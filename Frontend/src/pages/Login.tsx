import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles, UserCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'signup' | 'forgot'

const DEMO_HINTS = [
  { label: 'Sales Manager', email: 'maya@dealflow360.com', note: 'Full internal access' },
  { label: 'Admin', email: 'admin@dealflow360.com', note: 'All permissions + config' },
  { label: 'Salesperson', email: 'jordan@dealflow360.com', note: 'Quotes & fulfillment' },
  { label: 'Customer', email: 'olivia@northstarlabs.com', note: 'Customer portal only' },
]

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  // Redirect already-logged-in users
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'Customer' ? '/customer/quotation' : from ?? '/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate, from])

  useEffect(() => {
    emailRef.current?.focus()
  }, [mode])

  function validate() {
    if (!email.trim()) return 'Please enter your email address.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
    if (mode !== 'forgot' && !password) return 'Please enter your password.'
    if (mode !== 'forgot' && password.length < 6) return 'Password must be at least 6 characters.'
    return ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    if (mode === 'forgot') {
      setLoading(true)
      await new Promise((r) => setTimeout(r, 800))
      setLoading(false)
      setForgotSent(true)
      return
    }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Authentication failed.')
    }
    // On success, the useEffect above will redirect
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail)
    setPassword('password')
    setError('')
  }

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-art">
        <div className="auth-brand">
          <div className="brand-mark">D<span>3</span>6</div>
          <strong>DealFlow360</strong>
        </div>

        <div className="auth-art-content">
          <div className="auth-quote">
            <Sparkles size={26} className="auth-sparkle" />
            <h1>Every deal has a next best move.</h1>
            <p>One intelligent workspace for the teams turning opportunity into revenue — with governance, not guesswork.</p>
          </div>

          <div className="auth-feature-list">
            {[
              'Multi-tier discount governance',
              'Live upsell & cross-sell intelligence',
              'Automated approval routing',
              'Deal health monitoring & alerts',
            ].map((f) => (
              <div className="auth-feature" key={f}>
                <span className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-footer">
          <span className="live-dot" />
          <span>Ready for backend connection · Demo mode active</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form">
        <div className="auth-form-inner">
          <div className="mobile-auth-brand">
            <div className="brand-mark">D<span>3</span>6</div>
            <strong>DealFlow360</strong>
          </div>

          {mode === 'login' && (
            <>
              <div className="eyebrow">Welcome back</div>
              <h1>Sign in to your workspace</h1>
              <p className="auth-subtitle">Enter your credentials to continue.</p>

              <form onSubmit={handleSubmit} noValidate>
                <label>
                  Email address
                  <div className="input-wrap">
                    <Mail size={15} className="input-icon" />
                    <input
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="you@company.com"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </label>

                <label>
                  Password
                  <div className="input-wrap">
                    <Lock size={15} className="input-icon" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button type="button" className="input-eye" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                <div className="form-options">
                  <label className="checkbox">
                    <input type="checkbox" /> Remember me
                  </label>
                  <button type="button" className="link-button" onClick={() => { setMode('forgot'); setError('') }}>
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="auth-error">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <button className="button button-primary auth-submit" type="submit" disabled={loading}>
                  {loading ? <><Loader2 size={15} className="spin" /> Signing in...</> : <>Sign in <ArrowRight size={15} /></>}
                </button>
              </form>

              {/* Demo quick-fill */}
              <div className="auth-divider"><span>quick demo access</span></div>
              <div className="demo-grid">
                {DEMO_HINTS.map((d) => (
                  <button key={d.email} className="demo-pill" type="button" onClick={() => fillDemo(d.email)}>
                    <UserCheck size={12} />
                    <span>
                      <strong>{d.label}</strong>
                      <small>{d.note}</small>
                    </span>
                  </button>
                ))}
              </div>
              <p className="auth-hint">All demo accounts use password: <code>password</code></p>

              <p className="auth-signup">
                New to DealFlow360?{' '}
                <button type="button" className="link-button bold" onClick={() => { setMode('signup'); setError('') }}>
                  Create an account
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <>
              <div className="eyebrow">Get started</div>
              <h1>Create your account</h1>
              <p className="auth-subtitle">Join your team's workspace.</p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-row-2">
                  <label>First name<div className="input-wrap"><input ref={emailRef} type="text" placeholder="Maya" disabled={loading} /></div></label>
                  <label>Last name<div className="input-wrap"><input type="text" placeholder="Chen" disabled={loading} /></div></label>
                </div>

                <label>
                  Work email
                  <div className="input-wrap">
                    <Mail size={15} className="input-icon" />
                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="you@company.com" autoComplete="email" disabled={loading} />
                  </div>
                </label>

                <label>
                  Password
                  <div className="input-wrap">
                    <Lock size={15} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} placeholder="Min. 6 characters" autoComplete="new-password" disabled={loading} />
                    <button type="button" className="input-eye" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                {error && <div className="auth-error"><AlertCircle size={14} />{error}</div>}

                <button className="button button-primary auth-submit" type="submit" disabled={loading}>
                  {loading ? <><Loader2 size={15} className="spin" /> Creating account...</> : <>Create account <ArrowRight size={15} /></>}
                </button>
              </form>

              <p className="auth-signup">
                Already have an account?{' '}
                <button type="button" className="link-button bold" onClick={() => { setMode('login'); setError('') }}>
                  Sign in
                </button>
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div className="eyebrow">Account recovery</div>
              <h1>Reset your password</h1>
              <p className="auth-subtitle">We'll send a reset link to your email.</p>

              {forgotSent ? (
                <div className="auth-success">
                  <div className="auth-success-icon">✓</div>
                  <strong>Check your inbox</strong>
                  <p>A password reset link has been sent to <em>{email}</em>. It expires in 15 minutes.</p>
                  <button type="button" className="button button-secondary" onClick={() => { setMode('login'); setForgotSent(false) }}>
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <label>
                    Email address
                    <div className="input-wrap">
                      <Mail size={15} className="input-icon" />
                      <input ref={emailRef} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="you@company.com" autoComplete="email" disabled={loading} />
                    </div>
                  </label>

                  {error && <div className="auth-error"><AlertCircle size={14} />{error}</div>}

                  <button className="button button-primary auth-submit" type="submit" disabled={loading}>
                    {loading ? <><Loader2 size={15} className="spin" /> Sending link...</> : <>Send reset link <ArrowRight size={15} /></>}
                  </button>

                  <button type="button" className="button button-secondary auth-back" onClick={() => { setMode('login'); setError('') }}>
                    Back to sign in
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
