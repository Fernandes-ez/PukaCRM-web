export interface AuditLogEntry {
  id: string
  actor_employee_id: string | null
  actor_label: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata_json: Record<string, unknown> | null
  created_at: string
}

/** Rótulo em português pra cada `action` conhecida - `action` não mapeado cai no texto cru mesmo. */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  'employee.created': 'Funcionário criado',
  'assistant.created': 'Assistente configurado',
  'assistant.updated': 'Assistente editado',
  'auth.login_succeeded': 'Login realizado',
  'auth.login_failed': 'Tentativa de login falhou',
  'role.permissions_updated': 'Permissões do cargo alteradas',
}
