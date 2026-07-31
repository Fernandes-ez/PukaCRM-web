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
}
