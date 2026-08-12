import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { copilotService } from '@/services/copilotService'
import { copilotSuggestionKey } from '@/types/copilot'
import type { ConversationSuggestion } from '@/types/copilot'

/**
 * Lê a sugestão mais recente da conversa. Busca uma vez ao montar
 * (fallback pro caso do push de WebSocket ter sido perdido - achado
 * real: NotificationConnectionManager.push é fire-and-forget, sem
 * fila/retry) e continua recebendo atualização ao vivo depois, porque
 * useNotificationSocket escreve na MESMA chave de cache quando o evento
 * `copilot_suggestion` chega.
 */
export function useCopilotSuggestion(conversationId: string) {
  return useQuery<ConversationSuggestion | null>({
    queryKey: copilotSuggestionKey(conversationId),
    queryFn: () => copilotService.getLatest(conversationId),
    staleTime: Infinity,
  })
}

export function useMarkCopilotSuggestionUsed(conversationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (suggestionId: string) => copilotService.markUsed(conversationId, suggestionId),
    onSuccess: (suggestion) => {
      queryClient.setQueryData(copilotSuggestionKey(conversationId), suggestion)
    },
  })
}
