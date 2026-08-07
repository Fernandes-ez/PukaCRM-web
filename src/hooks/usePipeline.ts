import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pipelineService } from '@/services/pipelineService'
import type { PipelineStageCreateRequest, PipelineStageReorderRequest, PipelineStageUpdateRequest } from '@/types/pipeline'

export const pipelineKey = ['pipeline'] as const

export function usePipeline() {
  return useQuery({ queryKey: pipelineKey, queryFn: pipelineService.get })
}

export function useCreatePipelineStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PipelineStageCreateRequest) => pipelineService.createStage(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKey }),
  })
}

export function useUpdatePipelineStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PipelineStageUpdateRequest }) =>
      pipelineService.updateStage(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKey }),
  })
}

export function useDeletePipelineStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pipelineService.deleteStage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKey }),
  })
}

export function useReorderPipelineStages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PipelineStageReorderRequest) => pipelineService.reorderStages(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKey }),
  })
}
