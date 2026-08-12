export interface Role {
  id: string
  company_id: string
  name: string
  description?: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface RoleCreateRequest {
  name: string
  description?: string
}

export interface RoleUpdateRequest {
  name?: string
  description?: string
}

export type PermissionModule =
  | 'COMPANY'
  | 'EMPLOYEES'
  | 'ROLES'
  | 'WHATSAPP'
  | 'ASSISTANT'
  | 'LEADS'
  | 'CONVERSATIONS'
  | 'PIPELINE'
  | 'TASKS'
  | 'REPORTS'
  | 'INTEGRATIONS'
  | 'SETTINGS'
  | 'SUBSCRIPTION'
  | 'CAMPAIGNS'

export type PermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'MANAGE'
  | 'TRANSFER'
  | 'EXPORT'
  | 'IMPORT'
  | 'ASSIGN'

/** Catálogo completo de permissões disponíveis (GET /permissions). `name` já vem pronto em português do backend. */
export interface Permission {
  id: string
  module: PermissionModule
  module_order: number
  resource: string
  action: PermissionAction
  name: string
  description: string | null
  display_order: number
}

export interface RolePermissionsResponse {
  role_id: string
  permission_ids: string[]
}

export interface UpdateRolePermissionsRequest {
  permission_ids: string[]
}

export const PERMISSION_MODULE_LABEL: Record<PermissionModule, string> = {
  COMPANY: 'Empresa',
  EMPLOYEES: 'Funcionários',
  ROLES: 'Cargos',
  WHATSAPP: 'WhatsApp',
  ASSISTANT: 'Assistente Virtual',
  LEADS: 'Leads',
  CONVERSATIONS: 'Conversas',
  PIPELINE: 'Pipeline',
  TASKS: 'Tarefas',
  REPORTS: 'Relatórios',
  INTEGRATIONS: 'Integrações',
  SETTINGS: 'Configurações',
  SUBSCRIPTION: 'Assinatura',
  CAMPAIGNS: 'Campanhas',
}
