import { api, normalizeApiError } from '@/services/apiClient'
import type {
  ChangePasswordRequest,
  EmployeeMe,
  EmployeeMeUpdateRequest,
  LoginRequest,
  LoginResponse,
  SelectCompanyRequest,
} from '@/types/auth'
import type { Permission } from '@/types/role'

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async selectCompany(payload: SelectCompanyRequest): Promise<LoginResponse> {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login/select-company', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async me(): Promise<EmployeeMe> {
    try {
      const { data } = await api.get<EmployeeMe>('/employees/me')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Permissões efetivas do funcionário logado (via o cargo dele) — sem exigir ROLES/role/VIEW. */
  async myPermissions(): Promise<Permission[]> {
    try {
      const { data } = await api.get<Permission[]>('/employees/me/permissions')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Autoedição — nunca exige EMPLOYEES/employee/UPDATE (a maioria dos cargos não tem por padrão). */
  async updateMe(payload: EmployeeMeUpdateRequest): Promise<EmployeeMe> {
    try {
      const { data } = await api.patch<EmployeeMe>('/employees/me', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async changePassword(payload: ChangePasswordRequest): Promise<EmployeeMe> {
    try {
      const { data } = await api.post<EmployeeMe>('/employees/me/change-password', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
