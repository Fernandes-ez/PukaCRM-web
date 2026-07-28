import { api, normalizeApiError } from '@/services/apiClient'
import type { Assistant, AssistantCreateRequest, AssistantUpdateRequest } from '@/types/assistant'

/** Recurso singular (1 por empresa) — sem {id} na URL. */
export const assistantService = {
  async get(): Promise<Assistant> {
    try {
      const { data } = await api.get<Assistant>('/assistant')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(payload: AssistantCreateRequest): Promise<Assistant> {
    try {
      const { data } = await api.post<Assistant>('/assistant', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** `compiled_prompt` é só leitura — nunca mandar no payload. */
  async update(payload: AssistantUpdateRequest): Promise<Assistant> {
    try {
      const { data } = await api.patch<Assistant>('/assistant', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
