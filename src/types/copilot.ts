export interface ConversationSuggestion {
  id: string
  conversation_id: string
  objection_summary: string | null
  suggestion_text: string
  used: boolean
  created_at: string
}

/**
 * Sugestão é 100% automática - só chega por push do WebSocket quando o
 * pré-filtro do backend detecta objeção (sem botão/gatilho manual, ver
 * CLAUDE.MD). Não existe GET de listagem, então essa chave é só o slot de
 * cache que useNotificationSocket escreve.
 */
export function copilotSuggestionKey(conversationId: string) {
  return ['conversations', conversationId, 'copilot-suggestion'] as const
}
