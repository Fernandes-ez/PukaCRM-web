import { api, normalizeApiError } from '@/services/apiClient'
import type {
  Charge,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanChangeRequest,
  SubscriptionPlanOption,
  SubscriptionPlanPreview,
  SubscriptionStatusInfo,
  TemplateUsageOverview,
} from '@/types/subscription'

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

  async getStatus(): Promise<SubscriptionStatusInfo> {
    try {
      const { data } = await api.get<SubscriptionStatusInfo>('/subscription/status')
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

  async listPlans(): Promise<SubscriptionPlanOption[]> {
    try {
      const { data } = await api.get<SubscriptionPlanOption[]>('/subscription/plans')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async previewPlanChange(plan: SubscriptionPlan): Promise<SubscriptionPlanPreview> {
    try {
      const { data } = await api.get<SubscriptionPlanPreview>('/subscription/plan-preview', { params: { plan } })
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async listCharges(): Promise<Charge[]> {
    try {
      const { data } = await api.get<Charge[]>('/subscription/charges')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async getTemplateUsage(): Promise<TemplateUsageOverview> {
    try {
      const { data } = await api.get<TemplateUsageOverview>('/subscription/template-usage')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
