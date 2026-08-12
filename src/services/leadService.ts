import { api, normalizeApiError } from '@/services/apiClient'
import type {
  Lead,
  LeadAssignRequest,
  LeadCreateRequest,
  LeadImportResult,
  LeadMoveStageRequest,
  LeadUpdateRequest,
  StartConversationBulkRequest,
  StartConversationBulkResponse,
} from '@/types/lead'
import type { ConversationRead } from '@/types/conversation'

export interface StartConversationRequest {
  template_id: string
}

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

  /** Mover no Pipeline (drag-and-drop do Kanban). */
  async moveStage(id: string, payload: LeadMoveStageRequest): Promise<Lead> {
    try {
      const { data } = await api.patch<Lead>(`/leads/${id}/move-stage`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async exportLeads(format: 'csv' | 'xlsx'): Promise<Blob> {
    try {
      const { data } = await api.get<Blob>('/leads/export', {
        params: { format },
        responseType: 'blob',
      })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async importLeads(file: File): Promise<LeadImportResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<LeadImportResult>('/leads/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async downloadImportTemplate(format: 'csv' | 'xlsx'): Promise<Blob> {
    try {
      const { data } = await api.get<Blob>('/leads/import/template', {
        params: { format },
        responseType: 'blob',
      })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Único jeito de iniciar contato fora da janela de atendimento de 24h da Meta. */
  async startConversation(id: string, payload: StartConversationRequest): Promise<ConversationRead> {
    try {
      const { data } = await api.post<ConversationRead>(`/leads/${id}/start-conversation`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Nunca rejeita por causa de 1 lead problemático - o resultado por item já vem no corpo da resposta. */
  async startConversationBulk(payload: StartConversationBulkRequest): Promise<StartConversationBulkResponse> {
    try {
      const { data } = await api.post<StartConversationBulkResponse>('/leads/start-conversation-bulk', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
