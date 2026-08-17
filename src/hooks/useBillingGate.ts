import { useSubscriptionStatus } from '@/hooks/useSubscription'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export interface BillingGate {
  /** Bloqueia ações de maior custo: campanha, template, iniciar conversa, criar funcionário/cargo, salvar Assistente/WhatsApp. */
  blocked: boolean
  /** Responder conversa tem 1 dia de carência a mais que as outras ações (mesma regra de `require_active_billing(grace_period_days=1)` do backend). */
  blockedForMessaging: boolean
  reason: string | null
}

/**
 * Espelha exatamente `require_active_billing` do backend
 * (`app/core/dependencies.py`, decisões #48/#50) - dois motivos possíveis:
 * `Company.status=SUSPENDED` (assinatura vencida/cancelada de verdade,
 * bloqueia na hora, sem carência) ou trial acabado sem nenhuma cobrança
 * provisionada no Asaas (bloqueia depois da carência). Usado pra desabilitar
 * botões/formulários na UI em vez de só deixar a ação falhar com 402 -
 * o backend continua sendo a fonte de verdade, isso é só refletir o mesmo
 * estado visualmente antes da tentativa.
 */
export function useBillingGate(): BillingGate {
  const { data } = useSubscriptionStatus()

  if (!data) return { blocked: false, blockedForMessaging: false, reason: null }

  if (data.status === 'PAST_DUE' || data.status === 'CANCELED') {
    return {
      blocked: true,
      blockedForMessaging: true,
      reason: 'Sua assinatura está com pagamento pendente - regularize em Assinatura pra continuar usando este recurso.',
    }
  }

  const trialExpired = data.status === 'TRIALING' && !!data.trial_ends_at && new Date(data.trial_ends_at) < new Date()
  if (trialExpired && !data.has_billing_configured) {
    const trialEndMs = new Date(data.trial_ends_at as string).getTime()
    return {
      blocked: true,
      blockedForMessaging: Date.now() > trialEndMs + ONE_DAY_MS,
      reason: 'Seu período de teste acabou e ainda não há cobrança configurada - complete o CPF/CNPJ da empresa em Minha Empresa pra continuar usando este recurso.',
    }
  }

  return { blocked: false, blockedForMessaging: false, reason: null }
}
