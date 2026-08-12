import { api, normalizeApiError } from '@/services/apiClient'
import type {
  Employee,
  EmployeeCreateRequest,
  EmployeeCreateResponse,
  EmployeeUpdateRequest,
} from '@/types/employee'

export const employeeService = {
  async list(): Promise<Employee[]> {
    try {
      const { data } = await api.get<Employee[]>('/employees')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async get(id: string): Promise<Employee> {
    try {
      const { data } = await api.get<Employee>(`/employees/${id}`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(payload: EmployeeCreateRequest): Promise<EmployeeCreateResponse> {
    try {
      const { data } = await api.post<EmployeeCreateResponse>('/employees', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async update(id: string, payload: EmployeeUpdateRequest): Promise<Employee> {
    try {
      const { data } = await api.patch<Employee>(`/employees/${id}`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Desativa o funcionário (não apaga). */
  async deactivate(id: string): Promise<void> {
    try {
      await api.delete(`/employees/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Reset administrativo - gera senha temporária nova, devolvida em texto puro uma única vez. */
  async resetPassword(id: string): Promise<EmployeeCreateResponse> {
    try {
      const { data } = await api.post<EmployeeCreateResponse>(`/employees/${id}/reset-password`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
