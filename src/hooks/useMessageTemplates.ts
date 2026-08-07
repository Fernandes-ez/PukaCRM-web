import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { messageTemplateService } from '@/services/messageTemplateService'
import type { MessageTemplateCreateRequest } from '@/types/messageTemplate'

export const messageTemplatesKey = ['message-templates'] as const

export function useMessageTemplates() {
  return useQuery({ queryKey: messageTemplatesKey, queryFn: messageTemplateService.list })
}

export function useCreateMessageTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MessageTemplateCreateRequest) => messageTemplateService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageTemplatesKey }),
  })
}

export function useDeleteMessageTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => messageTemplateService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageTemplatesKey }),
  })
}
