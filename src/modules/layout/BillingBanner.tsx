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
 * #29 não dá isso pra Supervisor/Consultora/Recepção). Duas situações
 * possíveis, cada uma com seu próprio texto - pedido explícito do
 * usuário. Continua visível enquanto a condição for verdadeira porque é
 * aviso de risco de acesso, não é "decorativo".
 */
export function BillingBanner() {
  const { data } = useSubscriptionStatus()
  const { hasPermission } = useAuth()
  const [setupOpen, setSetupOpen] = useState(false)

  if (!data) return null

  const trialEnded = data.status === 'TRIALING' && !!data.trial_ends_at && new Date(data.trial_ends_at) < new Date()
  const pastDue = data.status === 'PAST_DUE'

  if (!trialEnded && !pastDue) return null

  const canEditCompany = hasPermission('COMPANY', 'company', 'UPDATE')
  const canViewSubscription = hasPermission('SUBSCRIPTION', 'subscription', 'VIEW')

  return (
    <>
      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm font-medium',
          trialEnded && 'bg-warning/15 text-warning-foreground dark:text-amber-300',
          pastDue && 'bg-destructive/15 text-destructive dark:text-red-300',
        )}
      >
        {trialEnded ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CreditCard className="h-4 w-4 shrink-0" />}
        <span>
          {trialEnded
            ? 'O período de teste acabou e ainda não há cobrança configurada.'
            : 'Sua assinatura está com pagamento pendente.'}
        </span>
        {trialEnded && canEditCompany && (
          <button type="button" onClick={() => setSetupOpen(true)} className="underline underline-offset-2 hover:no-underline">
            Completar cadastro
          </button>
        )}
        {pastDue && canViewSubscription && (
          <a href="/assinatura" className="underline underline-offset-2 hover:no-underline">
            Ver assinatura
          </a>
        )}
      </div>

      {trialEnded && <BillingSetupDialog open={setupOpen} onOpenChange={setSetupOpen} autoOpen />}
    </>
  )
}
