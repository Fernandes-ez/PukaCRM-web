export type AssistantStatus = 'ACTIVE' | 'INACTIVE'

export interface Assistant {
  id: string
  company_id: string
  name: string
  persona: string
  company_context: string
  knowledge_context: string | null
  business_rules: string
  transfer_rules: string
  tone_of_voice: string
  additional_instructions: string | null
  /** Gerado automaticamente pelo backend a cada create/update — nunca aceito em payload. */
  compiled_prompt: string
  compiled_prompt_updated_at: string
  welcome_message: string | null
  transfer_message: string | null
  can_schedule_appointments: boolean
  scheduling_instructions: string | null
  status: AssistantStatus
}

export interface AssistantCreateRequest {
  name: string
  persona: string
  company_context: string
  knowledge_context?: string
  business_rules: string
  transfer_rules: string
  tone_of_voice: string
  additional_instructions?: string
  /**
   * Se omitido, o backend aplica um texto padrão de plataforma (evita `null` indo pro fluxo do n8n).
   * Não mandar string vazia pra forçar isso — só omitir a chave mesmo.
   */
  welcome_message?: string
  transfer_message?: string
  can_schedule_appointments?: boolean
  scheduling_instructions?: string
}

export interface AssistantUpdateRequest {
  name?: string
  persona?: string
  company_context?: string
  knowledge_context?: string
  business_rules?: string
  transfer_rules?: string
  tone_of_voice?: string
  additional_instructions?: string
  welcome_message?: string
  transfer_message?: string
  can_schedule_appointments?: boolean
  scheduling_instructions?: string
  status?: AssistantStatus
}
