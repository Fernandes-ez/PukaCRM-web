import { platformAdminApi } from '@/platform-admin/api/platformAdminClient'
import { normalizeApiError } from '@/services/apiClient'
import type { AuditLogEntry } from '@/types/auditLog'
import type { CompanyAdmin, CompanyStatus } from '@/types/platformAdmin'

interface LoginResponse {
  access_token: string
  token_type: string
}

export const platformAdminService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data } = await platformAdminApi.post<LoginResponse>('/platform-admin/auth/login', {
        email,
        password,
      })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async listCompanies(): Promise<CompanyAdmin[]> {
    try {
      const { data } = await platformAdminApi.get<CompanyAdmin[]>('/platform-admin/companies')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async getCompany(id: string): Promise<CompanyAdmin> {
    try {
      const { data } = await platformAdminApi.get<CompanyAdmin>(`/platform-admin/companies/${id}`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async setCompanyStatus(id: string, status: CompanyStatus): Promise<CompanyAdmin> {
    try {
      const { data } = await platformAdminApi.patch<CompanyAdmin>(`/platform-admin/companies/${id}/status`, {
        status,
      })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async listAuditLog(companyId?: string): Promise<AuditLogEntry[]> {
    try {
      const { data } = await platformAdminApi.get<AuditLogEntry[]>('/platform-admin/audit-log', {
        params: { company_id: companyId, limit: 100 },
      })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
