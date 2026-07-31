import { api, normalizeApiError } from '@/services/apiClient'
import type { Company, CompanyUpdateRequest } from '@/types/company'

/** Recurso singular (1 por empresa, é a própria empresa logada) — sem {id} na URL. */
export const companyService = {
  async get(): Promise<Company> {
    try {
      const { data } = await api.get<Company>('/companies/me')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async update(payload: CompanyUpdateRequest): Promise<Company> {
    try {
      const { data } = await api.patch<Company>('/companies/me', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /**
   * Encerra a conta (soft delete — `Company.status` vira `INACTIVE`, desconecta o WhatsApp junto).
   * Owner-only no backend. Não reversível por nenhuma tela — só o operador da plataforma reverte.
   */
  async closeAccount(): Promise<Company> {
    try {
      const { data } = await api.delete<Company>('/companies/me')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
