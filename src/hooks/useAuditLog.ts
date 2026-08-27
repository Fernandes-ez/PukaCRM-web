import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '@/services/auditLogService'

export function useAuditLog() {
  return useQuery({ queryKey: ['audit-log'], queryFn: auditLogService.list })
}
