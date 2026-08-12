import { api, normalizeApiError } from '@/services/apiClient'
import type { ConversationSuggestion } from '@/types/copilot'

export const copilotService = {
  /**
   * Fallback pro painel buscar ao abrir - o push em tempo real do
   * WebSocket continua sendo o caminho principal, isso aqui só cobre o
   * caso da entrega ao vivo ter sido perdida (achado real: o push do
   * backend é fire-and-forget, sem fila/retry). Devolve `null` se não
   * tiver sugestão pendente (ou a conversa não for atribuída a você).
   */
  async getLatest(conversationId: string): Promise<ConversationSuggestion | null> {
    try {
      const { data } = await api.get<ConversationSuggestion | null>(`/conversations/${conversationId}/copilot-suggestion`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async markUsed(conversationId: string, suggestionId: string): Promise<ConversationSuggestion> {
    try {
      const { data } = await api.post<ConversationSuggestion>(
        `/conversations/${conversationId}/copilot-suggestion/${suggestionId}/mark-used`,
      )
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
