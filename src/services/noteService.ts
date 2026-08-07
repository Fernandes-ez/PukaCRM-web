import { api, normalizeApiError } from '@/services/apiClient'
import type { Note, NoteCreateRequest } from '@/types/note'

export const noteService = {
  async listByLead(leadId: string): Promise<Note[]> {
    try {
      const { data } = await api.get<Note[]>(`/leads/${leadId}/notes`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(leadId: string, payload: NoteCreateRequest): Promise<Note> {
    try {
      const { data } = await api.post<Note>(`/leads/${leadId}/notes`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/notes/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
