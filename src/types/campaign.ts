import type { LeadGender } from '@/types/lead'

export type CampaignStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'CANCELED'

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  QUEUED: 'Na fila',
  RUNNING: 'Enviando',
  COMPLETED: 'Concluída',
  CANCELED: 'Cancelada',
}

export interface CampaignFilters {
  gender?: LeadGender | null
  min_age?: number | null
  max_age?: number | null
  /** 1-12, ou omitido/null pra "qualquer mês". */
  birthday_month?: number | null
  pipeline_stage_id?: string | null
}

export interface CampaignCreateRequest {
  name: string
  message_template_id: string
  filters: CampaignFilters
}

export interface CampaignPreviewResponse {
  count: number
}

export interface Campaign {
  id: string
  company_id: string
  name: string
  message_template_id: string
  created_by_employee_id: string
  status: CampaignStatus
  filters: CampaignFilters
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
  started_at: string | null
  completed_at: string | null
}
