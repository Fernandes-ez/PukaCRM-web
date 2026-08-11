import { api, normalizeApiError } from '@/services/apiClient'
import type { ConversationSuggestion } from '@/types/copilot'

export const copilotService = {
  /** Sob demanda - síncrono, o backend só responde quando a sugestão já está pronta. */
  async requestSuggestion(conversationId: string): Promise<ConversationSuggestion> {
    try {
      const { data } = await api.post<ConversationSuggestion>(`/conversations/${conversationId}/copilot-suggestion`)
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
