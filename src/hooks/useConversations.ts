import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { conversationService } from '@/services/conversationService'
import { leadsKey } from '@/hooks/useLeads'
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

export function useAssignableEmployees() {
  return useQuery({
    queryKey: [...conversationsKey, 'assignable-employees'],
    queryFn: conversationService.listAssignableEmployees,
  })
}

export function useAssignConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignConversationRequest }) =>
      conversationService.assign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationsKey })
      // Atribuir a conversa agora também atribui o Lead (ver CLAUDE.MD do
      // backend, decisão #33) - sem isso a tela de Leads ficaria com o
      // dono antigo até a próxima navegação/refetch natural.
      queryClient.invalidateQueries({ queryKey: leadsKey })
    },
  })
}

export function useUnassignConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => conversationService.unassign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationsKey }),
  })
}

export function useCloseConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => conversationService.close(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationsKey }),
  })
}
