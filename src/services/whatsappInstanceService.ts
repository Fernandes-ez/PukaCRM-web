import { api, normalizeApiError } from '@/services/apiClient'
import type {
  RegenerateApiKeyResponse,
  WhatsAppInstance,
  WhatsAppInstanceCreateRequest,
  WhatsAppInstanceCreateResponse,
  WhatsAppInstanceUpdateRequest,
} from '@/types/whatsappInstance'

/** Recurso singular (1 por empresa) — sem {id} na URL. */
export const whatsappInstanceService = {
  async get(): Promise<WhatsAppInstance> {
    try {
      const { data } = await api.get<WhatsAppInstance>('/whatsapp-instance')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Devolve a service_api_key em texto puro — só nessa resposta. */
  async create(payload: WhatsAppInstanceCreateRequest): Promise<WhatsAppInstanceCreateResponse> {
    try {
      const { data } = await api.post<WhatsAppInstanceCreateResponse>('/whatsapp-instance', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async update(payload: WhatsAppInstanceUpdateRequest): Promise<WhatsAppInstance> {
    try {
      const { data } = await api.patch<WhatsAppInstance>('/whatsapp-instance', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Desconecta a instância (não apaga). */
  async disconnect(): Promise<void> {
    try {
      await api.delete('/whatsapp-instance')
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async regenerateApiKey(): Promise<RegenerateApiKeyResponse> {
    try {
      const { data } = await api.post<RegenerateApiKeyResponse>('/whatsapp-instance/api-key/regenerate')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
