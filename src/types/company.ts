export type CompanyStatus = 'ACTIVE' | 'TRIAL' | 'INACTIVE' | 'SUSPENDED'

export const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  ACTIVE: 'Ativa',
  TRIAL: 'Em teste',
  INACTIVE: 'Encerrada',
  SUSPENDED: 'Suspensa',
}

export type SchedulingVisibilityMode = 'SHARED' | 'RESTRICTED'

export const SCHEDULING_VISIBILITY_MODE_LABEL: Record<SchedulingVisibilityMode, string> = {
  SHARED: 'Agenda geral (todo mundo com permissão vê tudo)',
  RESTRICTED: 'Cada um só vê a própria agenda',
}

export interface Company {
  id: string
  owner_employee_id: string | null
  name: string
  slug: string
  email: string
  phone: string
  legal_name: string | null
  document: string | null
  website: string | null
  zip_code: string | null
  street: string | null
  number: string | null
  complement: string | null
  district: string | null
  city: string | null
  state: string | null
  country: string | null
  timezone: string
  language: string
  auto_redistribution_enabled: boolean
  redistribution_after_days: number
  closing_message: string | null
  scheduling_enabled: boolean
  scheduling_visibility_mode: SchedulingVisibilityMode
  scheduling_reminder_hours_before: number
  scheduling_min_notice_minutes: number
  scheduling_max_days_ahead: number
  scheduling_reminder_template_id: string | null
  status: CompanyStatus
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface CompanyUpdateRequest {
  name?: string
  phone?: string
  legal_name?: string
  document?: string
  website?: string
  zip_code?: string
  street?: string
  number?: string
  complement?: string
  district?: string
  city?: string
  state?: string
  country?: string
  timezone?: string
  language?: string
  auto_redistribution_enabled?: boolean
  redistribution_after_days?: number
  closing_message?: string
  scheduling_enabled?: boolean
  scheduling_visibility_mode?: SchedulingVisibilityMode
  scheduling_reminder_hours_before?: number
  scheduling_min_notice_minutes?: number
  scheduling_max_days_ahead?: number
  scheduling_reminder_template_id?: string | null
}
