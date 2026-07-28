import { api, normalizeApiError } from '@/services/apiClient'
import type { EmployeeMe, LoginRequest, LoginResponse, SelectCompanyRequest } from '@/types/auth'
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
}
