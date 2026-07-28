import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { conversationService } from '@/services/conversationService'
import type { AssignConversationRequest, SendMessageRequest } from '@/types/conversation'

export const conversationsKey = ['conversations'] as const

export function useConversations() {
  return useQuery({ queryKey: conversationsKey, queryFn: conversationService.list, refetchInterval: 15000 })
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: [...conversationsKey, id],
    queryFn: () => conversationService.get(id as string),
    enabled: !!id,
  })
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: [...conversationsKey, conversationId, 'messages'],
    queryFn: () => conversationService.listMessages(conversationId as string),
    enabled: !!conversationId,
    refetchInterval: 5000,
  })
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SendMessageRequest) => conversationService.sendMessage(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...conversationsKey, conversationId, 'messages'] })
      queryClient.invalidateQueries({ queryKey: conversationsKey })
    },
  })
}

export function useAssignConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignConversationRequest }) =>
      conversationService.assign(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationsKey }),
  })
}
