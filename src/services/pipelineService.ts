import { api, normalizeApiError } from '@/services/apiClient'
import type {
  Pipeline,
  PipelineStage,
  PipelineStageCreateRequest,
  PipelineStageReorderRequest,
  PipelineStageUpdateRequest,
} from '@/types/pipeline'

/** Recurso singular (1 por empresa, get-or-create no backend) — sem {id} na URL do próprio Pipeline. */
export const pipelineService = {
  async get(): Promise<Pipeline> {
    try {
      const { data } = await api.get<Pipeline>('/pipeline')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async createStage(payload: PipelineStageCreateRequest): Promise<PipelineStage> {
    try {
      const { data } = await api.post<PipelineStage>('/pipeline/stages', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async updateStage(stageId: string, payload: PipelineStageUpdateRequest): Promise<PipelineStage> {
    try {
      const { data } = await api.patch<PipelineStage>(`/pipeline/stages/${stageId}`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async deleteStage(stageId: string): Promise<void> {
    try {
      await api.delete(`/pipeline/stages/${stageId}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async reorderStages(payload: PipelineStageReorderRequest): Promise<Pipeline> {
    try {
      const { data } = await api.put<Pipeline>('/pipeline/stages/reorder', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
