export type MessageTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
export type MessageTemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED'

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

export interface MessageTemplate {
  id: string
  company_id: string
  name: string
  language: string
  category: MessageTemplateCategory
  body_text: string
  footer_text: string | null
  status: MessageTemplateStatus
  rejected_reason: string | null
  body_variable_count: number
  created_at: string
  updated_at: string
}

export interface MessageTemplateCreateRequest {
  name: string
  language: string
  category: MessageTemplateCategory
  body_text: string
  footer_text?: string
}
