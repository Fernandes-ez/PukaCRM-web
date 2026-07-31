import { api, normalizeApiError } from '@/services/apiClient'
import type { Subscription, SubscriptionPlanChangeRequest } from '@/types/subscription'

/** Recurso singular (1 por empresa) — sem {id} na URL. */
export const subscriptionService = {
  async get(): Promise<Subscription> {
    try {
      const { data } = await api.get<Subscription>('/subscription')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async changePlan(payload: SubscriptionPlanChangeRequest): Promise<Subscription> {
    try {
      const { data } = await api.patch<Subscription>('/subscription/plan', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
