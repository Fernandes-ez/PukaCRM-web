export type MessageTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
export type MessageTemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED'

/** CUSTOM = atendente digita na hora. Os demais são resolvidos sozinhos a partir de dado que o CRM já tem. */
export type MessageTemplateVariableSource = 'CUSTOM' | 'LEAD_NAME' | 'LEAD_PHONE' | 'EMPLOYEE_NAME' | 'COMPANY_NAME'

export interface MessageTemplateVariable {
  label: string
  source: MessageTemplateVariableSource
}

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
  CUSTOM: 'Personalizado (digitar na hora)',
  LEAD_NAME: 'Nome do Lead',
  LEAD_PHONE: 'Telefone do Lead',
  EMPLOYEE_NAME: 'Nome de quem está enviando',
  COMPANY_NAME: 'Nome da empresa',
}

export interface MessageTemplate {
  id: string
  company_id: string
  name: string
  language: string
  category: MessageTemplateCategory
  body_text: string
  footer_text: string | null
  /** 1 entrada por variável, na ordem ({{1}}, {{2}}...) — nunca vai pra Meta, só uso nosso. */
  variables: MessageTemplateVariable[] | null
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
  variables?: MessageTemplateVariable[]
}

/** Rótulo de exibição de uma variável — usa o nome dado na criação, ou cai pro genérico. */
export function variableLabelOrFallback(variables: MessageTemplateVariable[] | null | undefined, index: number): string {
  const label = variables?.[index]?.label?.trim()
  return label ? label : `Variável ${index + 1}`
}
