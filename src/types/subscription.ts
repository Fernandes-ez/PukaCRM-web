export type SubscriptionPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

export const SUBSCRIPTION_PLAN_LABEL: Record<SubscriptionPlan, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
}

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: 'Em teste',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Pagamento atrasado',
  CANCELED: 'Cancelada',
}

export interface Subscription {
  id: string
  company_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_end: string | null
  /**
   * Sempre `false` na prática hoje — nenhum endpoint do backend chega a marcar isso como `true`
   * (nem o webhook, nem `PATCH /subscription/plan`). Exibir como informação, não construir ação
   * de "cancelar assinatura" em cima disso, não existe endpoint pra acionar.
   */
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionPlanChangeRequest {
  plan: SubscriptionPlan
}

/**
 * Versão minimalista de Subscription - só status/trial_ends_at, usada
 * pelo banner/popup de cobrança (`GET /subscription/status`, sem exigir
 * a permissão de ver Assinatura - visível pra qualquer funcionário
 * logado).
 */
export interface SubscriptionStatusInfo {
  status: SubscriptionStatus
  trial_ends_at: string | null
  /** Derivado de asaas_subscription_id no backend (nunca o id em si). */
  has_billing_configured: boolean
}

export type ChargeStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED' | 'OTHER'

export const CHARGE_STATUS_LABEL: Record<ChargeStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Paga',
  OVERDUE: 'Vencida',
  REFUNDED: 'Estornada',
  OTHER: 'Outro',
}

export interface Charge {
  value: number
  due_date: string
  payment_date: string | null
  status: ChargeStatus
  billing_type: string
  invoice_url: string
}
