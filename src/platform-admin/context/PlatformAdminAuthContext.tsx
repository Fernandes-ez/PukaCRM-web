import { createContext, useContext, useState, type ReactNode } from 'react'
import { getPlatformAdminToken, setPlatformAdminToken } from '@/platform-admin/api/platformAdminClient'
import { platformAdminService } from '@/platform-admin/services/platformAdminService'

interface PlatformAdminAuthContextValue {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const PlatformAdminAuthContext = createContext<PlatformAdminAuthContextValue | null>(null)

/**
 * Deliberadamente separado de AuthContext (o de Employee) - sem
 * GET /platform-admin/auth/me nem refetch de identidade (escopo enxuto
 * da Fase 3, ver plano); "autenticado" aqui é só "tem um token válido
 * guardado", o backend rejeita na primeira chamada se não for.
 */
export function PlatformAdminAuthProvider({ children }: { children: ReactNode }) {
  const [hasToken, setHasToken] = useState(() => !!getPlatformAdminToken())

  async function login(email: string, password: string): Promise<void> {
    const response = await platformAdminService.login(email, password)
    setPlatformAdminToken(response.access_token)
    setHasToken(true)
  }

  function logout() {
    setPlatformAdminToken(null)
    setHasToken(false)
  }

  return (
    <PlatformAdminAuthContext.Provider value={{ isAuthenticated: hasToken, login, logout }}>
      {children}
    </PlatformAdminAuthContext.Provider>
  )
}

export function usePlatformAdminAuth() {
  const ctx = useContext(PlatformAdminAuthContext)
  if (!ctx) throw new Error('usePlatformAdminAuth deve ser usado dentro de PlatformAdminAuthProvider')
  return ctx
}
