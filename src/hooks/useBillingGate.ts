import { useSubscriptionStatus } from '@/hooks/useSubscription'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export interface BillingGate {
  /** Bloqueia ações de maior custo: campanha, template, iniciar conversa, criar funcionário/cargo, salvar Assistente/WhatsApp. */
  blocked: boolean
  /** Responder conversa tem 1 dia de carência a mais que as outras ações (mesma regra de `require_active_billing(grace_period_days=1)` do backend). */
  blockedForMessaging: boolean
  reason: string | null
  /**
   * Motivo SEPARADO de `blocked` acima - fatura de uso de Template do
   * WhatsApp (Meta, repasse via Asaas) vencida. Só bloqueia disparo de
   * Template (Campanha/iniciar conversa), não assinatura em si - espelha
   * `require_template_usage_paid` do backend, sem carência.
   */
  templateUsageOverdue: boolean
  templateUsageReason: string | null
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

  const templateUsage = {
    templateUsageOverdue: !!data?.template_usage_overdue,
    templateUsageReason: data?.template_usage_overdue
      ? `Há uma fatura de uso de mensagens do WhatsApp em aberto${
          data.template_usage_overdue_amount ? ` (R$ ${data.template_usage_overdue_amount.toFixed(2)})` : ''
        } - regularize em Assinatura pra continuar enviando Templates.`
      : null,
  }

  if (!data) return { blocked: false, blockedForMessaging: false, reason: null, ...templateUsage }

  if (data.status === 'PAST_DUE' || data.status === 'CANCELED') {
    return {
      blocked: true,
      blockedForMessaging: true,
      reason: 'Sua assinatura está com pagamento pendente - regularize em Assinatura pra continuar usando este recurso.',
      ...templateUsage,
    }
  }

  const trialExpired = data.status === 'TRIALING' && !!data.trial_ends_at && new Date(data.trial_ends_at) < new Date()
  if (trialExpired && !data.has_billing_configured) {
    const trialEndMs = new Date(data.trial_ends_at as string).getTime()
    return {
      blocked: true,
      blockedForMessaging: Date.now() > trialEndMs + ONE_DAY_MS,
      reason: 'Seu período de teste acabou e ainda não há cobrança configurada - complete o CPF/CNPJ da empresa em Minha Empresa pra continuar usando este recurso.',
      ...templateUsage,
    }
  }

  return { blocked: false, blockedForMessaging: false, reason: null, ...templateUsage }
}
