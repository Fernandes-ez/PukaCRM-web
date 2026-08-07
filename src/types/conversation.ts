export type ConversationStatus = 'OPEN' | 'PENDING' | 'CLOSED'
export type MessageSenderType = 'LEAD' | 'AI' | 'EMPLOYEE' | 'SYSTEM'
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
export type MessageContentType = 'TEXT' | 'AUDIO'

export interface ConversationRead {
  id: string
  company_id: string
  lead_id: string
  whatsapp_instance_id: string
  /**
   * O backend não faz join com Lead/Employee aqui (`ConversationRead` só tem os ids) —
   * resolver `lead_id`/`assigned_employee_id` pro nome no cliente, cruzando com
   * `useLeads()`/`useEmployees()` (mesmo padrão já usado em `LeadsPage.tsx`).
   */
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
