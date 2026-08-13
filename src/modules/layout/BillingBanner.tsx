import { useState } from 'react'
import { AlertTriangle, CreditCard } from 'lucide-react'
import { useSubscriptionStatus } from '@/hooks/useSubscription'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'
import { BillingSetupDialog } from '@/modules/layout/BillingSetupDialog'

/**
 * Faixa persistente (não dispensável) no topo do app - visível pra
 * qualquer funcionário logado, não só quem tem permissão de ver a tela
 * de Assinatura (`SUBSCRIPTION/subscription/VIEW`, matriz da decisão
 * #29 não dá isso pra Supervisor/Consultora/Recepção). 3 situações
 * possíveis, cada uma com seu próprio texto - pedido explícito do
 * usuário. Continua visível enquanto a condição for verdadeira porque é
 * aviso de risco de acesso, não é "decorativo".
 */
export function BillingBanner() {
  const { data } = useSubscriptionStatus()
  const { hasPermission } = useAuth()
  const [setupOpen, setSetupOpen] = useState(false)

  if (!data) return null

  const trialExpired = data.status === 'TRIALING' && !!data.trial_ends_at && new Date(data.trial_ends_at) < new Date()
  // Preencher o CPF/CNPJ provisiona a assinatura no Asaas, mas isso
  // sozinho não muda `status` (só o webhook de pagamento confirmado
  // faz isso) - achado real testando: sem checar has_billing_configured
  // aqui, o popup de "cadastrar documento" continuava aparecendo mesmo
  // depois de já ter sido preenchido.
  const needsDocument = trialExpired && !data.has_billing_configured
  const awaitingPayment = trialExpired && data.has_billing_configured
  const pastDue = data.status === 'PAST_DUE'

  if (!needsDocument && !awaitingPayment && !pastDue) return null

  const canEditCompany = hasPermission('COMPANY', 'company', 'UPDATE')
  const canViewSubscription = hasPermission('SUBSCRIPTION', 'subscription', 'VIEW')

  return (
    <>
      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm font-medium',
          needsDocument && 'bg-warning/15 text-warning-foreground dark:text-amber-300',
          (awaitingPayment || pastDue) && 'bg-destructive/15 text-destructive dark:text-red-300',
        )}
      >
        {needsDocument ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CreditCard className="h-4 w-4 shrink-0" />}
        <span>
          {needsDocument && 'O período de teste acabou e ainda não há cobrança configurada.'}
          {awaitingPayment && 'O período de teste acabou e há um débito em aberto.'}
          {pastDue && 'Sua assinatura está com pagamento pendente.'}
        </span>
        {needsDocument && canEditCompany && (
          <button type="button" onClick={() => setSetupOpen(true)} className="underline underline-offset-2 hover:no-underline">
            Completar cadastro
          </button>
        )}
        {(awaitingPayment || pastDue) && canViewSubscription && (
          <a href="/assinatura" className="underline underline-offset-2 hover:no-underline">
            Ver assinatura
          </a>
        )}
      </div>

      {needsDocument && <BillingSetupDialog open={setupOpen} onOpenChange={setSetupOpen} autoOpen />}
    </>
  )
}
