export type NotificationType = 'LEAD_ASSIGNED' | 'CONVERSATION_NEEDS_ATTENTION'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  related_lead_id: string | null
  related_conversation_id: string | null
  read_at: string | null
  created_at: string
}

export interface UnreadCount {
  unread_count: number
}
