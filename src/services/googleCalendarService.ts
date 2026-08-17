import { api, normalizeApiError } from '@/services/apiClient'
import type { GoogleCalendarConnectUrl, GoogleCalendarConnection } from '@/types/googleCalendar'

export const googleCalendarService = {
  async getStatus(): Promise<GoogleCalendarConnection | null> {
    try {
      const { data } = await api.get<GoogleCalendarConnection | null>('/google-calendar/status')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async getConnectUrl(): Promise<GoogleCalendarConnectUrl> {
    try {
      const { data } = await api.get<GoogleCalendarConnectUrl>('/google-calendar/connect')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async disconnect(): Promise<void> {
    try {
      await api.post('/google-calendar/disconnect')
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
