import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { copilotService } from '@/services/copilotService'
import { copilotSuggestionKey } from '@/types/copilot'
import type { ConversationSuggestion } from '@/types/copilot'

/**
 * Lê a sugestão mais recente da conversa - nunca busca sozinho (não existe
 * GET de listagem, ver types/copilot.ts), só reage ao cache que o push
 * automático (useNotificationSocket) escreve.
 */
export function useCopilotSuggestion(conversationId: string) {
  return useQuery<ConversationSuggestion | null>({
    queryKey: copilotSuggestionKey(conversationId),
    queryFn: () => null,
    enabled: false,
    initialData: null,
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
