import { api, normalizeApiError } from '@/services/apiClient'
import type { Lead, LeadAssignRequest, LeadCreateRequest, LeadUpdateRequest } from '@/types/lead'

export const leadService = {
  async list(): Promise<Lead[]> {
    try {
      const { data } = await api.get<Lead[]>('/leads')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async get(id: string): Promise<Lead> {
    try {
      const { data } = await api.get<Lead>(`/leads/${id}`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(payload: LeadCreateRequest): Promise<Lead> {
    try {
      const { data } = await api.post<Lead>('/leads', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async update(id: string, payload: LeadUpdateRequest): Promise<Lead> {
    try {
      const { data } = await api.patch<Lead>(`/leads/${id}`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Arquiva o lead (não apaga). */
  async archive(id: string): Promise<void> {
    try {
      await api.delete(`/leads/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Atribuir responsável é ação separada de editar. */
  async assign(id: string, payload: LeadAssignRequest): Promise<Lead> {
    try {
      const { data } = await api.patch<Lead>(`/leads/${id}/assign`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
