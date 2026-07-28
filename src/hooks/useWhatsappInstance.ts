import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { whatsappInstanceService } from '@/services/whatsappInstanceService'
import type { WhatsAppInstanceCreateRequest, WhatsAppInstanceUpdateRequest } from '@/types/whatsappInstance'

export const whatsappInstanceKey = ['whatsapp-instance'] as const

export function useWhatsappInstance() {
  return useQuery({ queryKey: whatsappInstanceKey, queryFn: whatsappInstanceService.get, retry: false })
}

export function useCreateWhatsappInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WhatsAppInstanceCreateRequest) => whatsappInstanceService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappInstanceKey }),
  })
}

export function useUpdateWhatsappInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WhatsAppInstanceUpdateRequest) => whatsappInstanceService.update(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappInstanceKey }),
  })
}

export function useDisconnectWhatsappInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => whatsappInstanceService.disconnect(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappInstanceKey }),
  })
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => whatsappInstanceService.regenerateApiKey(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappInstanceKey }),
  })
}
