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
  is_owner: boolean
  must_change_password: boolean
  status: 'ACTIVE' | 'INACTIVE'
}
