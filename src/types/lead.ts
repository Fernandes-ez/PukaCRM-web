export type LeadStatus = 'NEW' | 'IN_PROGRESS' | 'QUALIFIED' | 'LOST' | 'ARCHIVED'

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: 'Novo',
  IN_PROGRESS: 'Em atendimento',
  QUALIFIED: 'Qualificado',
  LOST: 'Perdido',
  ARCHIVED: 'Arquivado',
}

export interface Lead {
  id: string
  company_id: string
  name: string
  phone: string
  email?: string | null
  status: LeadStatus
  assigned_employee_id?: string | null
  assigned_employee_name?: string | null
  created_at: string
  updated_at: string
}

export interface LeadCreateRequest {
  name: string
  phone: string
  email?: string
}

export interface LeadUpdateRequest {
  name?: string
  phone?: string
  email?: string
  status?: LeadStatus
}

export interface LeadAssignRequest {
  employee_id: string
}
