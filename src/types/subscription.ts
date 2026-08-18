/** Reprecificação de 2026-08-19 - reduzido de 3 pra 2 planos (Starter/Professional/Enterprise saíram). */
export type SubscriptionPlan = 'ESSENCIAL' | 'COMPLETO'
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
export type SubscriptionBillingCycle = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL'

export const SUBSCRIPTION_PLAN_LABEL: Record<SubscriptionPlan, string> = {
  ESSENCIAL: 'Essencial',
  COMPLETO: 'Completo',
}

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: 'Em teste',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Pagamento atrasado',
  CANCELED: 'Cancelada',
}

export const SUBSCRIPTION_BILLING_CYCLE_LABEL: Record<SubscriptionBillingCycle, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
}

export interface Subscription {
  id: string
  company_id: string
  plan: SubscriptionPlan
  billing_cycle: SubscriptionBillingCycle
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
  /** Opcional - só quando o usuário também troca o ciclo de cobrança na mesma ação. */
  billing_cycle?: SubscriptionBillingCycle
}

/**
 * Uma linha da matriz plano x ciclo (`GET /subscription/plans`, 2 planos x
 * 4 ciclos = 8 linhas) - fonte única de verdade, nunca hardcode duplicado
 * de preço/desconto aqui.
 */
export interface SubscriptionPlanOption {
  plan: SubscriptionPlan
  billing_cycle: SubscriptionBillingCycle
  /** "Por mês", só pra comparação visual entre ciclos - não é o valor cobrado de uma vez. */
  monthly_equivalent: number
  /** Valor cobrado de fato a cada ocorrência do ciclo (ex: trimestral cobra isso a cada 3 meses). */
  total_charge: number
  discount_percent: number
}

/**
 * Prévia da troca de plano (`GET /subscription/plan-preview`) - não aplica
 * nada, só mostra o valor real antes de confirmar. `prorated_charge: null`
 * significa "sem cobrança agora" (downgrade, trial, ou plano ainda sem
 * assinatura provisionada no Asaas) - só `monthly_price` passa a valer a
 * partir de `current_period_end`.
 */
export interface SubscriptionPlanPreview {
  plan: SubscriptionPlan
  monthly_price: number
  prorated_charge: number | null
  current_period_end: string | null
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
