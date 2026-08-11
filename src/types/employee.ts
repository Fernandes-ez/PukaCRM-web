export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'VACATION' | 'LEAVE' | 'DISABLED'

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  VACATION: 'Em férias',
  LEAVE: 'Afastado',
  DISABLED: 'Desabilitado',
}

export interface Employee {
  id: string
  company_id: string
  role_id: string
  role_name?: string
  full_name: string
  email: string
  is_owner: boolean
  must_change_password: boolean
  status: EmployeeStatus
  /** Participa da distribuição automática de Leads/Conversas (round-robin) - ver DistributionPage. */
  receive_leads: boolean
  distribution_enabled: boolean
  /** Maior primeiro no rodízio - desempate por quem está há mais tempo sem receber. */
  distribution_priority: number
  max_active_leads: number
  created_at: string
  updated_at: string
}

export interface EmployeeCreateRequest {
  full_name: string
  email: string
  role_id: string
}

export interface EmployeeCreateResponse {
  employee: Employee
  temporary_password: string
}

export interface EmployeeUpdateRequest {
  full_name?: string
  email?: string
  role_id?: string
  status?: EmployeeStatus
  receive_leads?: boolean
  distribution_enabled?: boolean
  distribution_priority?: number
  max_active_leads?: number
}
