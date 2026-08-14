import type { EmployeeStatus } from '@/types/employee'

export interface LoginRequest {
  email: string
  password: string
}

export interface CompanyOption {
  id: string
  name: string
  slug: string
  logo?: string | null
}

export interface LoginTokenResponse {
  access_token: string
  token_type: string
}

export interface LoginRequiresCompanySelection {
  requires_company_selection: true
  companies: CompanyOption[]
}

export type LoginResponse = LoginTokenResponse | LoginRequiresCompanySelection

export function loginRequiresCompanySelection(
  response: LoginResponse,
): response is LoginRequiresCompanySelection {
  return 'requires_company_selection' in response && response.requires_company_selection === true
}

export interface SelectCompanyRequest {
  email: string
  password: string
  company_id: string
}

export interface EmployeeMe {
  id: string
  company_id: string
  role_id: string
  full_name: string
  email: string
  phone: string | null
  is_owner: boolean
  must_change_password: boolean
  status: EmployeeStatus
  /** Feature flag da Agenda - exposto aqui pra Sidebar decidir sem precisar de GET /company (COMPANY/company/VIEW). */
  company_scheduling_enabled: boolean
}

/** Autoedição - bem mais restrita que `EmployeeUpdateRequest` (sem cargo/status/distribuição). */
export interface EmployeeMeUpdateRequest {
  full_name?: string
  email?: string
  phone?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}
