import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/spinner'
import type { PermissionAction, PermissionModule } from '@/types/role'

interface RequirePermissionProps {
  module: PermissionModule
  resource: string
  action: PermissionAction
}

/** Restringe a rota a quem tem a permissão efetiva (via GET /employees/me/permissions). */
export function RequirePermission({ module, resource, action }: RequirePermissionProps) {
  const { isLoadingPermissions, hasPermission } = useAuth()

  if (isLoadingPermissions) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    )
  }

  if (!hasPermission(module, resource, action)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
