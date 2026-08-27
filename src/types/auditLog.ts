export interface AuditLogEntry {
  id: string
  company_id: string
  actor_employee_id: string | null
  actor_label: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata_json: Record<string, unknown> | null
  created_at: string
}

/**
 * `actor_label` fica nulo quando quem agiu não é um Employee (ex: admin
 * da plataforma) - nesse caso a identidade vai em metadata_json em vez
 * da FK. Sem isso, a coluna "Quem" ficaria em branco pra toda ação do
 * console de admin - achado testando a tela de auditoria cross-tenant.
 */
export function resolveActorLabel(entry: AuditLogEntry): string {
  if (entry.actor_label) return entry.actor_label
  const platformAdminEmail = entry.metadata_json?.platform_admin_email
  if (typeof platformAdminEmail === 'string') return `${platformAdminEmail} (admin da plataforma)`
  return '—'
}

/** Rótulo em português pra cada `action` conhecida - `action` não mapeado cai no texto cru mesmo. */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  'employee.created': 'Funcionário criado',
  'assistant.created': 'Assistente configurado',
  'assistant.updated': 'Assistente editado',
  'auth.login_succeeded': 'Login realizado',
  'auth.login_failed': 'Tentativa de login falhou',
  'role.permissions_updated': 'Permissões do cargo alteradas',
  'company.status_changed_by_platform_admin': 'Status da empresa alterado (admin da plataforma)',
}
