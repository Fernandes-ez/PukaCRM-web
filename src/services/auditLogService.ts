import { api, normalizeApiError } from '@/services/apiClient'
import type { AuditLogEntry } from '@/types/auditLog'

export const auditLogService = {
  async list(): Promise<AuditLogEntry[]> {
    try {
      const { data } = await api.get<AuditLogEntry[]>('/audit-log', { params: { limit: 100 } })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
