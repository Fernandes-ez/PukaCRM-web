export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
}

export type AppointmentSource = 'EMPLOYEE' | 'AI' | 'SYSTEM'

export const APPOINTMENT_SOURCE_LABEL: Record<AppointmentSource, string> = {
  EMPLOYEE: 'Funcionário',
  AI: 'IA',
  SYSTEM: 'Sistema',
}

export type AppointmentTypeStatus = 'ACTIVE' | 'INACTIVE'

export interface AppointmentType {
  id: string
  company_id: string
  name: string
  description: string | null
  duration_minutes: number
  color: string | null
  status: AppointmentTypeStatus
  created_at: string
  updated_at: string
}

export interface AppointmentTypeCreateRequest {
  name: string
  description?: string | null
  duration_minutes?: number
  color?: string | null
}

export interface AppointmentTypeUpdateRequest {
  name?: string
  description?: string | null
  duration_minutes?: number
  color?: string | null
  status?: AppointmentTypeStatus
}

export interface Appointment {
  id: string
  company_id: string
  lead_id: string
  lead_full_name: string | null
  lead_phone: string
  employee_id: string
  employee_name: string
  appointment_type_id: string
  appointment_type_name: string
  appointment_type_color: string | null
  conversation_id: string | null
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  created_by: AppointmentSource
  created_by_employee_id: string | null
  notes: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentCreateRequest {
  lead_id: string
  employee_id: string
  appointment_type_id: string
  /** ISO com timezone. */
  starts_at: string
  notes?: string | null
}

export interface AppointmentUpdateRequest {
  employee_id?: string
  appointment_type_id?: string
  starts_at?: string
  notes?: string | null
  status?: AppointmentStatus
}

export interface AvailabilitySlot {
  appointment_type_id: string
  employee_id: string
  employee_name: string
  starts_at: string
  ends_at: string
  /** Pré-formatado no timezone da empresa, ex: "sexta, 15/08 às 13:00". */
  local_label: string
}

export interface ListAppointmentsParams {
  from_date: string
  to_date: string
  employee_id?: string
  lead_id?: string
  status?: AppointmentStatus
}

export interface AvailabilityParams {
  appointment_type_id: string
  from_date: string
  to_date: string
  employee_id?: string
}
