export type MessageTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
export type MessageTemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED'

/** Toda variável é amarrada a um campo real do CRM - resolvida pelo backend, nunca digitada. */
export type MessageTemplateVariableSource = 'LEAD_NAME' | 'LEAD_PHONE' | 'EMPLOYEE_NAME' | 'COMPANY_NAME'

export const MESSAGE_TEMPLATE_VARIABLE_SOURCES: MessageTemplateVariableSource[] = [
  'LEAD_NAME',
  'LEAD_PHONE',
  'EMPLOYEE_NAME',
  'COMPANY_NAME',
]

export type MessageTemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'

export const MESSAGE_TEMPLATE_CATEGORY_LABEL: Record<MessageTemplateCategory, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utilidade',
  AUTHENTICATION: 'Autenticação',
}

export const MESSAGE_TEMPLATE_STATUS_LABEL: Record<MessageTemplateStatus, string> = {
  PENDING: 'Em análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAUSED: 'Pausado',
  DISABLED: 'Desativado',
}

export const MESSAGE_TEMPLATE_VARIABLE_SOURCE_LABEL: Record<MessageTemplateVariableSource, string> = {
  LEAD_NAME: 'Nome do Lead',
  LEAD_PHONE: 'Telefone do Lead',
  EMPLOYEE_NAME: 'Quem está enviando',
  COMPANY_NAME: 'Nome da empresa',
}

/** Nome do parâmetro nomeado da Meta - espelha VARIABLE_TOKEN do backend (schemas.py). Fixo, nunca muda por template. */
export const MESSAGE_TEMPLATE_VARIABLE_TOKEN: Record<MessageTemplateVariableSource, string> = {
  LEAD_NAME: 'nome_lead',
  LEAD_PHONE: 'telefone_lead',
  EMPLOYEE_NAME: 'atendente',
  COMPANY_NAME: 'empresa',
}

export const MESSAGE_TEMPLATE_BUTTON_TYPE_LABEL: Record<MessageTemplateButtonType, string> = {
  QUICK_REPLY: 'Resposta rápida',
  URL: 'Link',
  PHONE_NUMBER: 'Telefone',
}

/**
 * `url`/`phone_number` só fazem sentido pro tipo correspondente - o
 * backend valida isso de verdade (`MessageTemplateButton`), aqui é só
 * pra dar feedback instantâneo no formulário antes do 422.
 */
export interface MessageTemplateButton {
  type: MessageTemplateButtonType
  text: string
  url?: string | null
  phone_number?: string | null
}

export interface MessageTemplate {
  id: string
  company_id: string
  name: string
  language: string
  category: MessageTemplateCategory
  body_text: string
  footer_text: string | null
  buttons: MessageTemplateButton[]
  /** Quais variáveis o corpo usa, na ordem em que aparecem - sempre derivado do body_text, nunca guardado à parte. */
  variables_used: MessageTemplateVariableSource[]
  status: MessageTemplateStatus
  rejected_reason: string | null
  created_at: string
  updated_at: string
}

export interface MessageTemplateCreateRequest {
  name: string
  language: string
  category: MessageTemplateCategory
  body_text: string
  footer_text?: string
  buttons?: MessageTemplateButton[]
}
