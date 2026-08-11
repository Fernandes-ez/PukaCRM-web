import { api, normalizeApiError } from '@/services/apiClient'
import type {
  AssignConversationRequest,
  ConversationRead,
  Message,
  SendMessageRequest,
} from '@/types/conversation'

export const conversationService = {
  async list(): Promise<ConversationRead[]> {
    try {
      const { data } = await api.get<ConversationRead[]>('/conversations')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async get(id: string): Promise<ConversationRead> {
    try {
      const { data } = await api.get<ConversationRead>(`/conversations/${id}`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async listMessages(id: string): Promise<Message[]> {
    try {
      const { data } = await api.get<Message[]>(`/conversations/${id}/messages`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Envia de verdade pro WhatsApp - fica status PENDING até o backend confirmar o envio. */
  async sendMessage(id: string, payload: SendMessageRequest): Promise<Message> {
    try {
      const { data } = await api.post<Message>(`/conversations/${id}/messages`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async assign(id: string, payload: AssignConversationRequest): Promise<ConversationRead> {
    try {
      const { data } = await api.post<ConversationRead>(`/conversations/${id}/assign`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Devolve a conversa pra IA — só vale pra próxima mensagem do Lead, não gera resposta retroativa. */
  async unassign(id: string): Promise<ConversationRead> {
    try {
      const { data } = await api.post<ConversationRead>(`/conversations/${id}/unassign`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Não existe "reabrir" — a próxima mensagem do Lead cria uma Conversation nova automaticamente. */
  async close(id: string): Promise<ConversationRead> {
    try {
      const { data } = await api.post<ConversationRead>(`/conversations/${id}/close`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Busca o áudio original (a Meta exige o access_token até pra baixar — só o backend tem, nunca o navegador). */
  async getAudio(conversationId: string, messageId: string): Promise<Blob> {
    try {
      const { data } = await api.get<Blob>(`/conversations/${conversationId}/messages/${messageId}/audio`, {
        responseType: 'blob',
      })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
