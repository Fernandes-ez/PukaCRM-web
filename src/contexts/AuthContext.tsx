import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import { ApiError, getStoredToken, setStoredToken } from '@/services/apiClient'
import { loginRequiresCompanySelection, type CompanyOption } from '@/types/auth'
import type { EmployeeMe } from '@/types/auth'
import type { Permission, PermissionAction, PermissionModule } from '@/types/role'

interface AuthContextValue {
  employee: EmployeeMe | null | undefined
  isLoadingEmployee: boolean
  isAuthenticated: boolean
  permissions: Permission[] | undefined
  isLoadingPermissions: boolean
  /** Confere se o funcionário logado tem a permissão efetiva (via GET /employees/me/permissions). */
  hasPermission: (module: PermissionModule, resource: string, action: PermissionAction) => boolean
  /** Retorna a lista de empresas se precisar de seleção, ou null se o login já completou. */
  login: (email: string, password: string) => Promise<CompanyOption[] | null>
  selectCompany: (email: string, password: string, companyId: string) => Promise<void>
  logout: () => void
  /**
   * Motivo do logout automático quando é distinguível (hoje só o caso de empresa
   * inativa/suspensa — 403 com mensagem própria do backend). `null` pros outros casos
   * (token inválido/expirado etc.), que continuam com o tratamento genérico de sempre.
   */
  logoutReason: string | null
  clearLogoutReason: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(() => !!getStoredToken())
  const [logoutReason, setLogoutReason] = useState<string | null>(null)

  const employeeQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    enabled: hasToken,
    retry: false,
  })

  const permissionsQuery = useQuery({
    queryKey: ['auth', 'permissions'],
    queryFn: authService.myPermissions,
    enabled: hasToken && !!employeeQuery.data,
    retry: false,
  })

  useEffect(() => {
    if (employeeQuery.isError) {
      const error = employeeQuery.error
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        // 403 aqui só acontece pela checagem de Company.status em get_current_employee (backend) —
        // mensagem própria e distinguível do 401 genérico de token inválido/expirado.
        if (error.status === 403) setLogoutReason(error.message)
        setStoredToken(null)
        setHasToken(false)
      }
    }
  }, [employeeQuery.isError, employeeQuery.error])

  async function login(email: string, password: string): Promise<CompanyOption[] | null> {
    const response = await authService.login({ email, password })
    if (loginRequiresCompanySelection(response)) {
      return response.companies
    }
    setStoredToken(response.access_token)
    setHasToken(true)
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    return null
  }

  async function selectCompany(email: string, password: string, companyId: string): Promise<void> {
    const response = await authService.selectCompany({ email, password, company_id: companyId })
    if (loginRequiresCompanySelection(response)) {
      throw new ApiError(0, 'Não foi possível concluir o login com a empresa selecionada.')
    }
    setStoredToken(response.access_token)
    setHasToken(true)
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }

  function logout() {
    setStoredToken(null)
    setHasToken(false)
    queryClient.clear()
  }

  function hasPermission(module: PermissionModule, resource: string, action: PermissionAction): boolean {
    return !!permissionsQuery.data?.some((p) => p.module === module && p.resource === resource && p.action === action)
  }

  const value: AuthContextValue = {
    employee: employeeQuery.data,
    isLoadingEmployee: hasToken && employeeQuery.isLoading,
    isAuthenticated: hasToken && !!employeeQuery.data,
    permissions: permissionsQuery.data,
    isLoadingPermissions: hasToken && !!employeeQuery.data && permissionsQuery.isLoading,
    hasPermission,
    login,
    selectCompany,
    logout,
    logoutReason,
    clearLogoutReason: () => setLogoutReason(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
