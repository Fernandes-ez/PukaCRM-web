import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leadService } from '@/services/leadService'
import type { LeadAssignRequest, LeadCreateRequest, LeadUpdateRequest } from '@/types/lead'

export const leadsKey = ['leads'] as const

export function useLeads() {
  return useQuery({ queryKey: leadsKey, queryFn: leadService.list })
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: [...leadsKey, id],
    queryFn: () => leadService.get(id as string),
    enabled: !!id,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: LeadCreateRequest) => leadService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LeadUpdateRequest }) => leadService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}

export function useArchiveLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leadService.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}

export function useAssignLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LeadAssignRequest }) => leadService.assign(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}
