import { api, normalizeApiError } from '@/services/apiClient'
import type { MessageTemplate, MessageTemplateCreateRequest } from '@/types/messageTemplate'

export const messageTemplateService = {
  async list(): Promise<MessageTemplate[]> {
    try {
      const { data } = await api.get<MessageTemplate[]>('/message-templates')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(payload: MessageTemplateCreateRequest): Promise<MessageTemplate> {
    try {
      const { data } = await api.post<MessageTemplate>('/message-templates', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/message-templates/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
