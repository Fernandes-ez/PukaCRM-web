export type LeadStatus = 'ACTIVE' | 'INACTIVE'

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Arquivado',
}

export interface Lead {
  id: string
  company_id: string
  /** Pode vir `null` — leads que chegam só com telefone (via WhatsApp) antes de dar o nome. */
  full_name: string | null
  phone: string
  email?: string | null
  status: LeadStatus
  /**
   * Só o id — o backend não expõe o nome do responsável aqui (`LeadRead` não faz join com
   * Employee). Resolver o nome no frontend usando a lista de `useEmployees()`.
   */
  assigned_employee_id?: string | null
  created_at: string
  updated_at: string
}

export interface LeadCreateRequest {
  phone: string
  full_name?: string
  email?: string
}

export interface LeadUpdateRequest {
  full_name?: string
  phone?: string
  email?: string
  status?: LeadStatus
}

export interface LeadAssignRequest {
  employee_id: string
}
