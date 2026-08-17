import { useEffect, useState } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/modules/layout/Sidebar'
import { Topbar } from '@/modules/layout/Topbar'
import { BillingBanner } from '@/modules/layout/BillingBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useNotificationSocket } from '@/hooks/useNotifications'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { googleCalendarStatusKey } from '@/hooks/useGoogleCalendar'
import { ChangePasswordDialog } from '@/pages/profile/ChangePasswordDialog'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { employee } = useAuth()
  useNotificationSocket()

  // Volta do redirect do backend depois do fluxo OAuth do Google Calendar
  // (GET /google-calendar/callback troca o código no servidor e redireciona
  // pra cá com o resultado via query param - nunca chega como XHR).
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  useEffect(() => {
    const result = searchParams.get('google_calendar')
    if (result === null) return
    if (result === 'connected') {
      toast({ title: 'Google Calendar conectado com sucesso', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: googleCalendarStatusKey })
    } else {
      toast({ title: 'Não foi possível conectar ao Google Calendar, tente novamente', variant: 'destructive' })
    }
    const next = new URLSearchParams(searchParams)
    next.delete('google_calendar')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
        <Topbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <BillingBanner />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Senha temporária do primeiro acesso - some sozinho quando muda, `useChangeMyPassword` já atualiza o cache de `employee`. */}
      <ChangePasswordDialog open={employee?.must_change_password === true} onOpenChange={() => {}} mandatory />
    </div>
  )
}
