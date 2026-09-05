import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type Role } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
  /** When true, this route is ONLY for customers — internal users get redirected */
  customerOnly?: boolean
}

export function ProtectedRoute({ children, allowedRoles, customerOnly }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (customerOnly && user?.role !== 'Customer') {
    return <Navigate to="/dashboard" replace />
  }

  if (!customerOnly && user?.role === 'Customer') {
    return <Navigate to="/customer/quotation" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
