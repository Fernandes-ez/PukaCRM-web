import { Navigate, Outlet } from 'react-router-dom'
import { usePlatformAdminAuth } from '@/platform-admin/context/PlatformAdminAuthContext'

export function PlatformAdminProtectedRoute() {
  const { isAuthenticated } = usePlatformAdminAuth()

  if (!isAuthenticated) {
    return <Navigate to="/platform-admin/login" replace />
  }

  return <Outlet />
}
