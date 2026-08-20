import type { LeadGender } from '@/types/lead'

export type CampaignStatus = 'SCHEDULED' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'CANCELED'

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  SCHEDULED: 'Agendada',
  QUEUED: 'Na fila',
  RUNNING: 'Enviando',
  COMPLETED: 'Concluída',
  CANCELED: 'Cancelada',
}

/** date.weekday() do Python: 0=segunda...6=domingo. */
export const WEEKDAY_LABEL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
export const WEEKDAY_LABEL_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

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
  /** ISO. Ausente/null = dispara assim que possível. */
  scheduled_at?: string | null
  /** date.weekday(): 0=segunda...6=domingo. Ausente/null = disparo único. */
  recurrence_days_of_week?: number[] | null
  /** YYYY-MM-DD - último dia em que uma ocorrência pode disparar. */
  recurrence_end_date?: string | null
}

export interface CampaignPreviewRequest {
  filters: CampaignFilters
  /** Opcional - só preenchido depois que o usuário escolhe o template (passo separado dos filtros). */
  template_id?: string | null
}

export interface CampaignPreviewResponse {
  count: number
  /**
   * Custo estimado de repasse do Template (Meta, via Asaas) - só vem
   * preenchido quando `template_id` foi informado no preview. Mostrado
   * ANTES de confirmar o disparo, pra nunca surpreender com uma cobrança.
   */
  template_category?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | null
  estimated_cost_brl?: number | null
}

export type CampaignRecipientStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'SKIPPED_OPT_OUT'
  | 'SKIPPED_ACTIVE_CONVERSATION'
  | 'CANCELED'

export const CAMPAIGN_RECIPIENT_STATUS_LABEL: Record<CampaignRecipientStatus, string> = {
  PENDING: 'Na fila',
  SENT: 'Enviado',
  FAILED: 'Falhou',
  SKIPPED_OPT_OUT: 'Pulado (opt-out)',
  SKIPPED_ACTIVE_CONVERSATION: 'Pulado (conversa em andamento)',
  CANCELED: 'Cancelado',
}

export interface CampaignRecipient {
  id: string
  lead_id: string
  lead_full_name: string | null
  lead_phone: string
  status: CampaignRecipientStatus
  error: string | null
  occurrence_date: string
  sent_at: string | null
  created_at: string
}

export interface Campaign {
  id: string
  company_id: string
  name: string
  message_template_id: string
  created_by_employee_id: string
  status: CampaignStatus
  filters: CampaignFilters
  scheduled_at: string | null
  recurrence_days_of_week: number[] | null
  recurrence_end_date: string | null
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
  started_at: string | null
  completed_at: string | null
}
