import { useState } from 'react'
import { Loader2, CreditCard, ExternalLink, Receipt } from 'lucide-react'
import { useSubscription, useChangeSubscriptionPlan, useCharges } from '@/hooks/useSubscription'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { formatDate, compareDatesDesc } from '@/utils/date'
import {
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  CHARGE_STATUS_LABEL,
  type Charge,
  type ChargeStatus,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '@/types/subscription'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const chargeStatusVariant: Record<ChargeStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'destructive',
  REFUNDED: 'secondary',
  OTHER: 'secondary',
}

const BILLING_TYPE_LABEL: Record<string, string> = {
  BOLETO: 'Boleto',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
  TRANSFER: 'Transferência',
  DEPOSIT: 'Depósito',
  UNDEFINED: 'A definir',
}

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
  const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null)

  async function handleConfirmChangePlan() {
    if (!confirmPlan) return
    try {
      await changePlan.mutateAsync({ plan: confirmPlan })
      toast({ title: 'Plano atualizado', variant: 'success' })
      setConfirmPlan(null)
    } catch (err) {
      toast({
        title: 'Não foi possível trocar de plano',
        description: err instanceof ApiError ? err.message : undefined,
        variant: 'destructive',
      })
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
                        disabled={isCurrent}
                        onClick={() => setConfirmPlan(plan)}
                      >
                        {isCurrent ? 'Atual' : 'Selecionar'}
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <ChargesCard />
          </>
        )
      )}

      <Dialog open={!!confirmPlan} onOpenChange={(open) => !open && !changePlan.isPending && setConfirmPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar de plano</DialogTitle>
            <DialogDescription>
              {confirmPlan &&
                `Trocar para o plano ${SUBSCRIPTION_PLAN_LABEL[confirmPlan]}? A troca é aplicada imediatamente.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmPlan(null)} disabled={changePlan.isPending}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmChangePlan} disabled={changePlan.isPending}>
              {changePlan.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar troca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function ChargesCard() {
  const { data: charges, isLoading, isError, error } = useCharges()
  const sorted = [...(charges ?? [])].sort((a, b) => compareDatesDesc(a.due_date, b.due_date))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cobranças</CardTitle>
        <CardDescription>Histórico de cobranças da sua assinatura</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError ? (
          <Alert variant="destructive">
            <AlertDescription>{error instanceof ApiError ? error.message : 'Erro ao carregar.'}</AlertDescription>
          </Alert>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Receipt className="h-8 w-8" />
            Nenhuma cobrança ainda
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((charge) => (
              <ChargeRow key={`${charge.due_date}-${charge.invoice_url}`} charge={charge} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChargeRow({ charge }: { charge: Charge }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">{currencyFormatter.format(charge.value)}</p>
          <Badge variant={chargeStatusVariant[charge.status]}>{CHARGE_STATUS_LABEL[charge.status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Vencimento {formatDate(charge.due_date)} · {BILLING_TYPE_LABEL[charge.billing_type] ?? charge.billing_type}
          {charge.payment_date && ` · Paga em ${formatDate(charge.payment_date)}`}
        </p>
      </div>
      <Button type="button" variant="outline" asChild>
        <a href={charge.invoice_url} target="_blank" rel="noopener noreferrer">
          Ver cobrança
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}
