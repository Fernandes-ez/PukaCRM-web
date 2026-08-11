export type ConversationSuggestionSource = 'ON_DEMAND' | 'AUTOMATIC'

export interface ConversationSuggestion {
  id: string
  conversation_id: string
  source: ConversationSuggestionSource
  objection_summary: string | null
  suggestion_text: string
  used: boolean
  created_at: string
}

/**
 * Sugestão é 100% "push-driven" (resposta do POST sob demanda, ou evento de
 * WebSocket do disparo automático) — não existe GET de listagem, então essa
 * chave é só um slot de cache que os dois lados escrevem.
 */
export function copilotSuggestionKey(conversationId: string) {
  return ['conversations', conversationId, 'copilot-suggestion'] as const
}
