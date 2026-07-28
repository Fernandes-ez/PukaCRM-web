import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assistantService } from '@/services/assistantService'
import type { AssistantCreateRequest, AssistantUpdateRequest } from '@/types/assistant'

export const assistantKey = ['assistant'] as const

export function useAssistant() {
  return useQuery({ queryKey: assistantKey, queryFn: assistantService.get, retry: false })
}

export function useCreateAssistant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssistantCreateRequest) => assistantService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assistantKey }),
  })
}

export function useUpdateAssistant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssistantUpdateRequest) => assistantService.update(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assistantKey }),
  })
}
