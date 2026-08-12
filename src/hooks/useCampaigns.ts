import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { campaignService } from '@/services/campaignService'
import type { CampaignCreateRequest, CampaignFilters } from '@/types/campaign'

export const campaignsKey = ['campaigns'] as const

/** Enviando/na fila mudam sozinhas (job do backend) - refetch periódico igual useConversations. */
export function useCampaigns() {
  return useQuery({ queryKey: campaignsKey, queryFn: campaignService.list, refetchInterval: 5000 })
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: [...campaignsKey, id],
    queryFn: () => campaignService.get(id as string),
    enabled: !!id,
    refetchInterval: 3000,
  })
}

/** Só faz sentido reconsultar enquanto a campanha ainda pode processar mais gente. */
export function useCampaignRecipients(id: string | undefined, activelyProcessing: boolean) {
  return useQuery({
    queryKey: [...campaignsKey, id, 'recipients'],
    queryFn: () => campaignService.getRecipients(id as string),
    enabled: !!id,
    refetchInterval: activelyProcessing ? 3000 : false,
  })
}

export function useCampaignPreview() {
  return useMutation({ mutationFn: (filters: CampaignFilters) => campaignService.preview(filters) })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CampaignCreateRequest) => campaignService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campaignsKey }),
  })
}

export function useCancelCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => campaignService.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campaignsKey }),
  })
}
