import { api, normalizeApiError } from '@/services/apiClient'
import type {
  Appointment,
  AppointmentCreateRequest,
  AppointmentType,
  AppointmentTypeCreateRequest,
  AppointmentTypeUpdateRequest,
  AppointmentUpdateRequest,
  AvailabilityParams,
  AvailabilitySlot,
  ListAppointmentsParams,
} from '@/types/appointment'

export const appointmentTypeService = {
  async list(): Promise<AppointmentType[]> {
    try {
      const { data } = await api.get<AppointmentType[]>('/appointment-types')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(payload: AppointmentTypeCreateRequest): Promise<AppointmentType> {
    try {
      const { data } = await api.post<AppointmentType>('/appointment-types', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async update(id: string, payload: AppointmentTypeUpdateRequest): Promise<AppointmentType> {
    try {
      const { data } = await api.patch<AppointmentType>(`/appointment-types/${id}`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(`/appointment-types/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}

export const appointmentService = {
  async list(params: ListAppointmentsParams): Promise<Appointment[]> {
    try {
      const { data } = await api.get<Appointment[]>('/appointments', { params })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async listByLead(leadId: string, fromDate: string, toDate: string): Promise<Appointment[]> {
    try {
      const { data } = await api.get<Appointment[]>('/appointments', {
        params: { lead_id: leadId, from_date: fromDate, to_date: toDate },
      })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async availability(params: AvailabilityParams): Promise<AvailabilitySlot[]> {
    try {
      const { data } = await api.get<AvailabilitySlot[]>('/appointments/availability', { params })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(payload: AppointmentCreateRequest): Promise<Appointment> {
    try {
      const { data } = await api.post<Appointment>('/appointments', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async update(id: string, payload: AppointmentUpdateRequest): Promise<Appointment> {
    try {
      const { data } = await api.patch<Appointment>(`/appointments/${id}`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async cancel(id: string, cancelReason?: string): Promise<Appointment> {
    try {
      const { data } = await api.post<Appointment>(`/appointments/${id}/cancel`, { cancel_reason: cancelReason ?? null })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
