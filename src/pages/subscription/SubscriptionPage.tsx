import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import { useSubscription, useChangeSubscriptionPlan } from '@/hooks/useSubscription'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/utils/date'
import {
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '@/types/subscription'

const statusVariant: Record<SubscriptionStatus, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  TRIALING: 'warning',
  ACTIVE: 'success',
  PAST_DUE: 'destructive',
  CANCELED: 'secondary',
}

const PLAN_ORDER: SubscriptionPlan[] = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE']

const PLAN_DESCRIPTION: Record<SubscriptionPlan, string> = {
  STARTER: 'Começando a organizar o atendimento',
  PROFESSIONAL: 'Equipe de atendimento com múltiplos funcionários',
  ENTERPRISE: 'Operação grande, suporte prioritário',
}

export function SubscriptionPage() {
  const { data: subscription, isLoading, isError, error } = useSubscription()
  const changePlan = useChangeSubscriptionPlan()
  const { toast } = useToast()
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlan | null>(null)

  async function handleChangePlan(plan: SubscriptionPlan) {
    if (!subscription || plan === subscription.plan) return
    if (!window.confirm(`Trocar para o plano ${SUBSCRIPTION_PLAN_LABEL[plan]}?`)) return
    setPendingPlan(plan)
    try {
      await changePlan.mutateAsync({ plan })
      toast({ title: 'Plano atualizado', variant: 'success' })
    } catch (err) {
      toast({
        title: 'Não foi possível trocar de plano',
        description: err instanceof ApiError ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setPendingPlan(null)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assinatura</h1>
        <p className="text-sm text-muted-foreground">Veja seu plano atual e faça upgrade quando precisar</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof ApiError && error.status === 404
              ? 'Nenhuma assinatura encontrada pra esta empresa. Entre em contato com o suporte.'
              : error instanceof ApiError
                ? error.message
                : 'Erro ao carregar.'}
          </AlertDescription>
        </Alert>
      ) : (
        subscription && (
          <>
            <SubscriptionSummary subscription={subscription} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trocar de plano</CardTitle>
                <CardDescription>A troca é aplicada imediatamente, sem período de carência</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {PLAN_ORDER.map((plan) => {
                  const isCurrent = plan === subscription.plan
                  const isPending = pendingPlan === plan && changePlan.isPending
                  return (
                    <div
                      key={plan}
                      className="flex items-center justify-between gap-3 rounded-md border p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {SUBSCRIPTION_PLAN_LABEL[plan]}
                          {isCurrent && (
                            <Badge variant="secondary" className="ml-2">
                              Plano atual
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{PLAN_DESCRIPTION[plan]}</p>
                      </div>
                      <Button
                        type="button"
                        variant={isCurrent ? 'outline' : 'default'}
                        disabled={isCurrent || changePlan.isPending}
                        onClick={() => handleChangePlan(plan)}
                      >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isCurrent ? 'Atual' : 'Selecionar'}
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  )
}

function SubscriptionSummary({ subscription }: { subscription: Subscription }) {
  return (
    <Card notch="tr">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="btn-cut-sm flex h-11 w-11 shrink-0 items-center justify-center bg-brand-600 text-white">
          <CreditCard className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">Plano {SUBSCRIPTION_PLAN_LABEL[subscription.plan]}</p>
            <Badge variant={statusVariant[subscription.status]}>{SUBSCRIPTION_STATUS_LABEL[subscription.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {subscription.status === 'TRIALING' && subscription.trial_ends_at
              ? `Teste grátis até ${formatDate(subscription.trial_ends_at)}`
              : subscription.current_period_end
                ? `Renova em ${formatDate(subscription.current_period_end)}`
                : 'Sem data de renovação registrada'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
