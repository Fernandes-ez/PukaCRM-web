export interface ConversationSuggestion {
  id: string
  conversation_id: string
  objection_summary: string | null
  suggestion_text: string
  used: boolean
  created_at: string
}

/**
 * Sugestão é 100% automática - só é gerada quando o pré-filtro do backend
 * detecta objeção (sem botão/gatilho manual, ver CLAUDE.MD). Chega por
 * push do WebSocket em tempo real OU por `GET .../copilot-suggestion`
 * (fallback buscado ao abrir o painel, ver useCopilotSuggestion) - os
 * dois escrevem nesta mesma chave de cache.
 */
export function copilotSuggestionKey(conversationId: string) {
  return ['conversations', conversationId, 'copilot-suggestion'] as const
}
