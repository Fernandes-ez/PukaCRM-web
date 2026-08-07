import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leadService } from '@/services/leadService'
import type { Lead, LeadAssignRequest, LeadCreateRequest, LeadUpdateRequest } from '@/types/lead'

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

export function useExportLeads() {
  return useMutation({ mutationFn: (format: 'csv' | 'xlsx') => leadService.exportLeads(format) })
}

export function useImportLeads() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => leadService.importLeads(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}

export function useDownloadImportTemplate() {
  return useMutation({ mutationFn: (format: 'csv' | 'xlsx') => leadService.downloadImportTemplate(format) })
}

/**
 * Atualização otimista pro drag-and-drop do Kanban — sem isso, o card
 * "voltaria" pra coluna antiga por um instante até a resposta do PATCH
 * chegar, dando uma sensação de atraso no arrastar. Primeiro uso desse
 * padrão no projeto (os outros hooks só invalidam e esperam o refetch).
 */
export function useMoveLeadStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pipelineStageId }: { id: string; pipelineStageId: string }) =>
      leadService.moveStage(id, { pipeline_stage_id: pipelineStageId }),
    onMutate: async ({ id, pipelineStageId }) => {
      await queryClient.cancelQueries({ queryKey: leadsKey })
      const previousLeads = queryClient.getQueryData<Lead[]>(leadsKey)
      queryClient.setQueryData<Lead[]>(leadsKey, (prev) =>
        prev?.map((lead) => (lead.id === id ? { ...lead, pipeline_stage_id: pipelineStageId } : lead)),
      )
      return { previousLeads }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLeads) queryClient.setQueryData(leadsKey, context.previousLeads)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}
