import { useState } from 'react'
import { Loader2, CreditCard, ExternalLink, Receipt, Check, X } from 'lucide-react'
import {
  useSubscription,
  useSubscriptionPlans,
  useChangeSubscriptionPlan,
  usePreviewPlanChange,
  useCharges,
} from '@/hooks/useSubscription'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'
import { formatDate, compareDatesDesc } from '@/utils/date'
import {
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  CHARGE_STATUS_LABEL,
  type Charge,
  type ChargeStatus,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionPlanPreview,
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

// Mesmo conteúdo já usado na página de Preços do crm-landing (Pricing.tsx)
// - mantido em sincronia manual, mesma ressalva já registrada no backend
// sobre PLAN_PRICES precisar bater com o que a landing anuncia.
const PLAN_FEATURES: Record<SubscriptionPlan, { included: string[]; excluded?: string[] }> = {
  STARTER: {
    included: [
      '1 número de WhatsApp (API oficial da Meta)',
      'Até 3 funcionários',
      'IA de atendimento (Assistente configurável)',
      'CRM completo: pipeline, tarefas e observações',
      'Distribuição automática de leads',
      'Controle de acesso por cargo',
    ],
    excluded: ['Puka Copilot'],
  },
  PROFESSIONAL: {
    included: [
      'Tudo do Starter',
      'Até 10 funcionários',
      'Puka Copilot — sugestão de venda em tempo real',
      'Campanhas segmentadas, com agendamento e recorrência',
      'Templates com botões (resposta rápida, link, telefone)',
      'Suporte prioritário',
    ],
  },
  ENTERPRISE: {
    included: [
      'Tudo do Professional',
      'Funcionários ilimitados',
      'Fila de campanha prioritária, maior volume de disparo',
      'Onboarding assistido + gerente de conta dedicado',
      'Suporte com SLA',
    ],
  },
}

export function SubscriptionPage() {
  const { data: subscription, isLoading, isError, error } = useSubscription()
  const { data: planOptions, isLoading: loadingPlans } = useSubscriptionPlans()
  const previewPlanChange = usePreviewPlanChange()
  const changePlan = useChangeSubscriptionPlan()
  const { toast } = useToast()
  const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null)
  const [preview, setPreview] = useState<SubscriptionPlanPreview | null>(null)

  const priceByPlan = new Map((planOptions ?? []).map((option) => [option.plan, option.monthly_price]))

  async function handleSelectPlan(plan: SubscriptionPlan) {
    setConfirmPlan(plan)
    setPreview(null)
    try {
      const result = await previewPlanChange.mutateAsync(plan)
      setPreview(result)
    } catch (err) {
      toast({
        title: 'Não foi possível calcular o valor da troca',
        description: err instanceof ApiError ? err.message : undefined,
        variant: 'destructive',
      })
      setConfirmPlan(null)
    }
  }

  async function handleConfirmChangePlan() {
    if (!confirmPlan) return
    try {
      await changePlan.mutateAsync({ plan: confirmPlan })
      toast({ title: 'Plano atualizado', variant: 'success' })
      setConfirmPlan(null)
      setPreview(null)
    } catch (err) {
      toast({
        title: 'Não foi possível trocar de plano',
        description: err instanceof ApiError ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
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

            <div>
              <h2 className="text-base font-semibold">Planos</h2>
              <p className="text-sm text-muted-foreground">
                Trocar pra um plano mais caro no meio do ciclo gera uma cobrança proporcional aos dias restantes -
                você vê o valor exato antes de confirmar.
              </p>

              {loadingPlans ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Skeleton className="h-96 w-full" />
                  <Skeleton className="h-96 w-full" />
                  <Skeleton className="h-96 w-full" />
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {PLAN_ORDER.map((plan) => {
                    const isCurrent = plan === subscription.plan
                    const price = priceByPlan.get(plan)
                    const features = PLAN_FEATURES[plan]
                    return (
                      <Card
                        key={plan}
                        className={cn('flex flex-col', plan === 'PROFESSIONAL' && !isCurrent && 'border-brand-400')}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{SUBSCRIPTION_PLAN_LABEL[plan]}</CardTitle>
                            {isCurrent && <Badge variant="secondary">Plano atual</Badge>}
                          </div>
                          <CardDescription>{PLAN_DESCRIPTION[plan]}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col">
                          <p className="text-2xl font-bold tracking-tight">
                            {price !== undefined ? currencyFormatter.format(price) : '—'}
                            <span className="text-sm font-normal text-muted-foreground">/mês</span>
                          </p>

                          <ul className="mt-4 flex-1 space-y-2 text-sm">
                            {features.included.map((feature) => (
                              <li key={feature} className="flex items-start gap-2">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                <span>{feature}</span>
                              </li>
                            ))}
                            {features.excluded?.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-muted-foreground">
                                <X className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>Sem {feature}</span>
                              </li>
                            ))}
                          </ul>

                          <Button
                            type="button"
                            className="mt-6"
                            variant={isCurrent ? 'outline' : 'default'}
                            disabled={isCurrent || (previewPlanChange.isPending && confirmPlan === plan)}
                            onClick={() => handleSelectPlan(plan)}
                          >
                            {previewPlanChange.isPending && confirmPlan === plan && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {isCurrent ? 'Plano atual' : 'Selecionar'}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <ChargesCard />
          </>
        )
      )}

      <Dialog
        open={!!confirmPlan}
        onOpenChange={(open) => {
          if (!open && !changePlan.isPending) {
            setConfirmPlan(null)
            setPreview(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar de plano</DialogTitle>
            <DialogDescription>
              {confirmPlan && `Confirme a troca pro plano ${SUBSCRIPTION_PLAN_LABEL[confirmPlan]}.`}
            </DialogDescription>
          </DialogHeader>

          {previewPlanChange.isPending || !preview ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <PlanChangeSummary preview={preview} />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmPlan(null)
                setPreview(null)
              }}
              disabled={changePlan.isPending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmChangePlan} disabled={changePlan.isPending || !preview}>
              {changePlan.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar troca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PlanChangeSummary({ preview }: { preview: SubscriptionPlanPreview }) {
  if (preview.prorated_charge && preview.prorated_charge > 0) {
    return (
      <Alert variant="warning">
        <AlertDescription className="space-y-1.5">
          <p>
            Você será cobrado <strong>{currencyFormatter.format(preview.prorated_charge)}</strong> agora - valor
            proporcional aos dias restantes do seu ciclo atual, pra migrar pro plano{' '}
            {SUBSCRIPTION_PLAN_LABEL[preview.plan]} já.
          </p>
          <p>
            A cobrança fica pendente na aba de Cobranças (PIX, boleto ou cartão). A partir de{' '}
            {preview.current_period_end ? formatDate(preview.current_period_end) : 'sua próxima renovação'}, sua
            mensalidade passa a ser {currencyFormatter.format(preview.monthly_price)}/mês.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <AlertDescription>
        Nenhuma cobrança será feita agora.{' '}
        {preview.current_period_end
          ? `A partir de ${formatDate(preview.current_period_end)}, sua mensalidade passa a ser ${currencyFormatter.format(preview.monthly_price)}/mês.`
          : `Sua mensalidade passa a ser ${currencyFormatter.format(preview.monthly_price)}/mês assim que a cobrança começar.`}
      </AlertDescription>
    </Alert>
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
