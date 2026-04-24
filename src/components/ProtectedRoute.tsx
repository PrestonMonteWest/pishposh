import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  emailVerificationRequired?: boolean
  children: ReactNode
}

export function ProtectedRoute({
  children,
  emailVerificationRequired,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (emailVerificationRequired && !user.emailVerified) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
