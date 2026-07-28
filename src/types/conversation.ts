export type ConversationStatus = 'OPEN' | 'PENDING' | 'CLOSED'
export type MessageSender = 'LEAD' | 'EMPLOYEE' | 'ASSISTANT'
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export interface ConversationRead {
  id: string
  company_id: string
  lead_id: string
  lead_name?: string
  assigned_employee_id?: string | null
  assigned_employee_name?: string | null
  status: ConversationStatus
  needs_human_attention: boolean
  last_message_at?: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender: MessageSender
  content: string
  status: MessageStatus
  created_at: string
}

export interface SendMessageRequest {
  content: string
}

export interface AssignConversationRequest {
  employee_id: string
}
