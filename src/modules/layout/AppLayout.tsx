import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/modules/layout/Sidebar'
import { Topbar } from '@/modules/layout/Topbar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useNotificationSocket } from '@/hooks/useNotifications'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  useNotificationSocket()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
        <Topbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
