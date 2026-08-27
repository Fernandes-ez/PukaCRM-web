export type CompanyStatus = 'ACTIVE' | 'TRIAL' | 'INACTIVE' | 'SUSPENDED'
export type SubscriptionPlan = 'ESSENCIAL' | 'COMPLETO'
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

export interface CompanyAdmin {
  id: string
  name: string
  slug: string
  document: string | null
  email: string
  status: CompanyStatus
  subscription_plan: SubscriptionPlan | null
  subscription_status: SubscriptionStatus | null
  created_at: string
}

export const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  ACTIVE: 'Ativa',
  TRIAL: 'Trial',
  INACTIVE: 'Inativa',
  SUSPENDED: 'Suspensa',
}
