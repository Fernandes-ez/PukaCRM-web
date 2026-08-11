export type ConversationStatus = 'OPEN' | 'PENDING' | 'CLOSED'
export type MessageSenderType = 'LEAD' | 'AI' | 'EMPLOYEE' | 'SYSTEM'
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
export type MessageContentType = 'TEXT' | 'AUDIO'

export interface ConversationRead {
  id: string
  company_id: string
  lead_id: string
  /**
   * Denormalizado direto do Lead pelo backend - não cruzar com `useLeads()`
   * pra resolver isso (a lista de Leads pode ser mais restrita que a de
   * Conversas, ver decisão #31 do `CLAUDE.MD` do backend: um funcionário
   * pode ver uma Conversation sem o Lead correspondente estar na "própria
   * carteira" de Leads dele).
   */
  lead_full_name: string | null
  lead_phone: string
  whatsapp_instance_id: string
  /** Resolver o nome do responsável cruzando com `useEmployees()` (mesmo padrão de sempre). */
  assigned_employee_id?: string | null
  status: ConversationStatus
  needs_human_attention: boolean
  last_message_at?: string | null
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: MessageSenderType
  /** Preenchido só quando `sender_type === 'EMPLOYEE'`. */
  sender_employee_id: string | null
  content: string
  /** 'AUDIO' — `content` é a transcrição (ou um placeholder até ser transcrita). */
  content_type: MessageContentType
  status: MessageStatus
  /** Id da mensagem no provedor (WhatsApp/Meta) — usado pro backend, não pra exibição. */
  external_message_id: string | null
  external_media_id: string | null
  created_at: string
}

export interface SendMessageRequest {
  content: string
}

export interface AssignConversationRequest {
  employee_id: string
}

/**
 * Versão enxuta de Employee (só id/nome) pra popular o seletor do diálogo
 * "Atribuir" - vem de `/conversations/assignable-employees`, gated pela
 * permissão de transferir conversa, não pela de ver o diretório inteiro
 * de Funcionários (que Consultora não tem por padrão, decisão #29 do
 * `CLAUDE.MD` do backend).
 */
export interface EmployeeOption {
  id: string
  full_name: string
}
