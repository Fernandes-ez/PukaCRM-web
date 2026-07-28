import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/spinner'
import { getStoredToken } from '@/services/apiClient'

export function ProtectedRoute() {
  const { isAuthenticated, isLoadingEmployee } = useAuth()
  const location = useLocation()
  const hasToken = !!getStoredToken()

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isLoadingEmployee) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
