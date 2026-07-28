import { api, normalizeApiError } from '@/services/apiClient'
import type { WorkSchedule, WorkScheduleCreateRequest, WorkScheduleUpdateRequest } from '@/types/workSchedule'

export const workScheduleService = {
  async list(employeeId: string): Promise<WorkSchedule[]> {
    try {
      const { data } = await api.get<WorkSchedule[]>(`/employees/${employeeId}/work-schedules`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(employeeId: string, payload: WorkScheduleCreateRequest): Promise<WorkSchedule> {
    try {
      const { data } = await api.post<WorkSchedule>(`/employees/${employeeId}/work-schedules`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async update(id: string, payload: WorkScheduleUpdateRequest): Promise<WorkSchedule> {
    try {
      const { data } = await api.patch<WorkSchedule>(`/work-schedules/${id}`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(`/work-schedules/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
