import { api, normalizeApiError } from '@/services/apiClient'
import type { Task, TaskCreateRequest, TaskUpdateRequest } from '@/types/task'

export const taskService = {
  async list(params?: { leadId?: string; assignedToMe?: boolean }): Promise<Task[]> {
    try {
      const { data } = await api.get<Task[]>('/tasks', {
        params: {
          lead_id: params?.leadId,
          assigned_to_me: params?.assignedToMe,
        },
      })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(payload: TaskCreateRequest): Promise<Task> {
    try {
      const { data } = await api.post<Task>('/tasks', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async update(id: string, payload: TaskUpdateRequest): Promise<Task> {
    try {
      const { data } = await api.patch<Task>(`/tasks/${id}`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/tasks/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
