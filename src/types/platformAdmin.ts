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

export interface ImpersonationResponse {
  access_token: string
  token_type: string
  company_name: string
  owner_name: string
}

export type SentryIssueSource = 'backend' | 'frontend'
export type SentryIssueLevel = 'error' | 'warning' | 'info' | 'debug' | 'fatal'

export interface SentryIssue {
  id: string
  short_id: string
  title: string
  culprit: string | null
  level: SentryIssueLevel
  status: string
  count: string
  user_count: number
  first_seen: string
  last_seen: string
  permalink: string
  source: SentryIssueSource
}

export interface PlatformErrors {
  configured: boolean
  issues: SentryIssue[]
}
