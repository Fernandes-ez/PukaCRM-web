import { api, normalizeApiError } from '@/services/apiClient'
import type {
  Campaign,
  CampaignCreateRequest,
  CampaignFilters,
  CampaignPreviewResponse,
  CampaignRecipient,
} from '@/types/campaign'

export const campaignService = {
  async list(): Promise<Campaign[]> {
    try {
      const { data } = await api.get<Campaign[]>('/campaigns')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async get(id: string): Promise<Campaign> {
    try {
      const { data } = await api.get<Campaign>(`/campaigns/${id}`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Só a contagem de quem bateria no filtro - não cria nada. */
  async preview(filters: CampaignFilters): Promise<CampaignPreviewResponse> {
    try {
      const { data } = await api.post<CampaignPreviewResponse>('/campaigns/preview', filters)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(payload: CampaignCreateRequest): Promise<Campaign> {
    try {
      const { data } = await api.post<Campaign>('/campaigns', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async getRecipients(id: string): Promise<CampaignRecipient[]> {
    try {
      const { data } = await api.get<CampaignRecipient[]>(`/campaigns/${id}/recipients`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async cancel(id: string): Promise<Campaign> {
    try {
      const { data } = await api.post<Campaign>(`/campaigns/${id}/cancel`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
