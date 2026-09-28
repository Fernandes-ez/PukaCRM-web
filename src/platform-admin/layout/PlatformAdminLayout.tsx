import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut, ShieldHalf } from 'lucide-react'
import { usePlatformAdminAuth } from '@/platform-admin/context/PlatformAdminAuthContext'
import { Button } from '@/components/ui/button'

/**
 * Deliberadamente minimalista/utilitário - não usa Sidebar/AppLayout do
 * app normal (é outro domínio de auth inteiro), e não tenta parecer o
 * produto "de cliente". Ninguém chega aqui por link de navegação - só
 * por URL direta.
 */
export function PlatformAdminLayout() {
  const { logout } = usePlatformAdminAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/platform-admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldHalf className="h-4 w-4 text-primary" />
          Puka — Console interno
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
