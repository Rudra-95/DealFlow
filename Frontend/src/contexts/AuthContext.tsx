import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Role = 'Admin' | 'Sales Manager' | 'Salesperson' | 'Customer'

export interface AuthUser {
  id: string
  name: string
  initials: string
  email: string
  role: Role
  company: string
  avatar?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  'maya@dealflow360.com': {
    id: 'u-1',
    name: 'Maya Chen',
    initials: 'MC',
    email: 'maya@dealflow360.com',
    role: 'Sales Manager',
    company: 'DealFlow360 HQ',
    password: 'password',
  },
  'admin@dealflow360.com': {
    id: 'u-2',
    name: 'Alex Rivers',
    initials: 'AR',
    email: 'admin@dealflow360.com',
    role: 'Admin',
    company: 'DealFlow360 HQ',
    password: 'password',
  },
  'jordan@dealflow360.com': {
    id: 'u-3',
    name: 'Jordan Lee',
    initials: 'JL',
    email: 'jordan@dealflow360.com',
    role: 'Salesperson',
    company: 'DealFlow360 HQ',
    password: 'password',
  },
  'olivia@northstarlabs.com': {
    id: 'u-4',
    name: 'Olivia Carter',
    initials: 'OC',
    email: 'olivia@northstarlabs.com',
    role: 'Customer',
    company: 'Northstar Labs',
    password: 'password',
  },
}

const AUTH_STORAGE_KEY = 'df360_auth_user'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as AuthUser) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 900))
    const match = DEMO_USERS[email.toLowerCase().trim()]
    if (!match || match.password !== password) {
      return { ok: false, error: 'Invalid email or password. Try the demo credentials below.' }
    }
    const { password: _pw, ...authUser } = match
    setUser(authUser)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
