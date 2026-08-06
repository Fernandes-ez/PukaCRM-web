import { api, normalizeApiError } from '@/services/apiClient'
import type { Notification, UnreadCount } from '@/types/notification'

/**
 * Sem `require_permission` no backend (só `get_current_employee`) — qualquer
 * funcionário logado vê as próprias notificações, mesmo padrão de
 * `GET /employees/me/permissions`.
 */
export const notificationService = {
  async list(): Promise<Notification[]> {
    try {
      const { data } = await api.get<Notification[]>('/notifications')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async unreadCount(): Promise<UnreadCount> {
    try {
      const { data } = await api.get<UnreadCount>('/notifications/unread-count')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async markRead(notificationId: string): Promise<Notification> {
    try {
      const { data } = await api.patch<Notification>(`/notifications/${notificationId}/read`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async markAllRead(): Promise<void> {
    try {
      await api.post('/notifications/read-all')
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
