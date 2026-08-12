export type NotificationType =
  | 'LEAD_ASSIGNED'
  | 'CONVERSATION_NEEDS_ATTENTION'
  | 'TASK_ASSIGNED'
  | 'TASK_DUE'
  | 'NEW_MESSAGE'
  | 'TEMPLATE_APPROVED'
  | 'TEMPLATE_REJECTED'
  | 'CAMPAIGN_COMPLETED'
  | 'CAMPAIGN_CANCELED'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  related_lead_id: string | null
  related_conversation_id: string | null
  related_task_id: string | null
  related_campaign_id: string | null
  read_at: string | null
  created_at: string
}

export interface UnreadCount {
  unread_count: number
}
