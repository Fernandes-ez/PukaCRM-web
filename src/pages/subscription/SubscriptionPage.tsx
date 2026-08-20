import { useState } from 'react'
import { Loader2, CreditCard, ExternalLink, Receipt, Check, X, MessageSquare } from 'lucide-react'
import {
  useSubscription,
  useSubscriptionPlans,
  useChangeSubscriptionPlan,
  usePreviewPlanChange,
  useCharges,
  useTemplateUsage,
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
  SUBSCRIPTION_BILLING_CYCLE_LABEL,
  CHARGE_STATUS_LABEL,
  TEMPLATE_USAGE_INVOICE_STATUS_LABEL,
  type Charge,
  type ChargeStatus,
  type Subscription,
  type SubscriptionBillingCycle,
  type SubscriptionPlan,
  type SubscriptionPlanOption,
  type SubscriptionPlanPreview,
  type SubscriptionStatus,
  type TemplateUsageInvoice,
  type TemplateUsageInvoiceStatus,
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

const templateUsageStatusVariant: Record<TemplateUsageInvoiceStatus, 'success' | 'warning' | 'destructive'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'destructive',
}

const PLAN_ORDER: SubscriptionPlan[] = ['ESSENCIAL', 'COMPLETO']
const CYCLE_ORDER: SubscriptionBillingCycle[] = ['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL']

const PLAN_DESCRIPTION: Record<SubscriptionPlan, string> = {
  ESSENCIAL: 'Começando a organizar o atendimento',
  COMPLETO: 'Equipe de vendas, com Agenda e Puka Copilot',
}

// Mesmo conteúdo já usado na página de Preços do crm-landing (Pricing.tsx)
// - mantido em sincronia manual, mesma ressalva já registrada no backend
// sobre PLAN_MONTHLY_PRICES precisar bater com o que a landing anuncia.
// Reprecificação de 2026-08-19: Enterprise deixou de ser plano formal -
// os diferenciais dele entraram no Completo sem aumentar o preço.
const PLAN_FEATURES: Record<SubscriptionPlan, { included: string[]; excluded?: string[] }> = {
  ESSENCIAL: {
    included: [
      '1 número de WhatsApp (API oficial da Meta)',
      'Até 3 funcionários',
      'IA de atendimento (Assistente configurável)',
      'CRM completo: pipeline, tarefas e observações',
      'Distribuição automática de leads',
      'Controle de acesso por cargo',
    ],
    excluded: ['Agenda de agendamentos', 'Puka Copilot'],
  },
  COMPLETO: {
    included: [
      'Tudo do Essencial',
      'Funcionários ilimitados',
      'Agenda de agendamentos — inclusive a IA marcando horário sozinha',
      'Puka Copilot — sugestão de venda em tempo real',
      'Campanhas segmentadas, com agendamento e recorrência',
      'Templates com botões (resposta rápida, link, telefone)',
      'Fila de campanha prioritária + onboarding assistido',
      'Suporte prioritário com SLA',
    ],
  },
}

export function SubscriptionPage() {
  const { data: subscription, isLoading, isError, error } = useSubscription()
  const { data: planOptions, isLoading: loadingPlans } = useSubscriptionPlans()
  const previewPlanChange = usePreviewPlanChange()
  const changePlan = useChangeSubscriptionPlan()
  const { toast } = useToast()
  const [selectedCycle, setSelectedCycle] = useState<SubscriptionBillingCycle>('MONTHLY')
  const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null)
  const [preview, setPreview] = useState<SubscriptionPlanPreview | null>(null)

  const optionByPlanCycle = new Map(
    (planOptions ?? []).map((option) => [`${option.plan}:${option.billing_cycle}`, option]),
  )

  async function handleSelectPlan(plan: SubscriptionPlan) {
    setConfirmPlan(plan)
    setPreview(null)
    // Rateio só existe pra troca de TIER - trocar só o ciclo (mesmo plano)
    // nunca gera cobrança agora, não precisa consultar a prévia.
    if (subscription && plan !== subscription.plan) {
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
  }

  async function handleConfirmChangePlan() {
    if (!confirmPlan) return
    try {
      await changePlan.mutateAsync({ plan: confirmPlan, billing_cycle: selectedCycle })
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

  const planChanged = subscription ? confirmPlan !== subscription.plan : false
  const cycleChanged = subscription ? selectedCycle !== subscription.billing_cycle : false
  const confirmOption = confirmPlan ? optionByPlanCycle.get(`${confirmPlan}:${selectedCycle}`) : undefined

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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Planos</h2>
                  <p className="text-sm text-muted-foreground">
                    Trocar pra um plano mais caro no meio do ciclo gera uma cobrança proporcional aos dias restantes -
                    você vê o valor exato antes de confirmar.
                  </p>
                </div>
                <div role="group" aria-label="Ciclo de cobrança" className="inline-flex items-center gap-1 rounded-md border p-1">
                  {CYCLE_ORDER.map((cycle) => (
                    <Button
                      key={cycle}
                      type="button"
                      variant={selectedCycle === cycle ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCycle(cycle)}
                    >
                      {SUBSCRIPTION_BILLING_CYCLE_LABEL[cycle]}
                    </Button>
                  ))}
                </div>
              </div>

              {loadingPlans ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-96 w-full" />
                  <Skeleton className="h-96 w-full" />
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {PLAN_ORDER.map((plan) => {
                    const isCurrentExact = plan === subscription.plan && selectedCycle === subscription.billing_cycle
                    const option = optionByPlanCycle.get(`${plan}:${selectedCycle}`)
                    const features = PLAN_FEATURES[plan]
                    return (
                      <Card
                        key={plan}
                        className={cn('flex flex-col', plan === 'COMPLETO' && !isCurrentExact && 'border-brand-400')}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{SUBSCRIPTION_PLAN_LABEL[plan]}</CardTitle>
                            {plan === subscription.plan && <Badge variant="secondary">Plano atual</Badge>}
                          </div>
                          <CardDescription>{PLAN_DESCRIPTION[plan]}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col">
                          <div>
                            <p className="text-2xl font-bold tracking-tight">
                              {option !== undefined ? currencyFormatter.format(option.monthly_equivalent) : '—'}
                              <span className="text-sm font-normal text-muted-foreground">/mês</span>
                            </p>
                            {option !== undefined && option.discount_percent > 0 && (
                              <p className="text-xs text-success">
                                {option.discount_percent}% de desconto · {currencyFormatter.format(option.total_charge)}{' '}
                                cobrado a cada {SUBSCRIPTION_BILLING_CYCLE_LABEL[selectedCycle].toLowerCase()}
                              </p>
                            )}
                          </div>

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
                            variant={isCurrentExact ? 'outline' : 'default'}
                            disabled={isCurrentExact || (previewPlanChange.isPending && confirmPlan === plan)}
                            onClick={() => handleSelectPlan(plan)}
                          >
                            {previewPlanChange.isPending && confirmPlan === plan && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {isCurrentExact ? 'Plano atual' : 'Selecionar'}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <TemplateUsageCard />
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
              {confirmPlan &&
                `Confirme a troca pro plano ${SUBSCRIPTION_PLAN_LABEL[confirmPlan]} (${SUBSCRIPTION_BILLING_CYCLE_LABEL[selectedCycle].toLowerCase()}).`}
            </DialogDescription>
          </DialogHeader>

          {planChanged && (previewPlanChange.isPending || !preview) ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <PlanChangeSummary
              preview={planChanged ? preview : null}
              cycleChanged={cycleChanged}
              option={confirmOption}
              cycle={selectedCycle}
              currentPeriodEnd={subscription?.current_period_end ?? null}
            />
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
            <Button
              type="button"
              onClick={handleConfirmChangePlan}
              disabled={changePlan.isPending || (planChanged && !preview)}
            >
              {changePlan.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar troca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PlanChangeSummary({
  preview,
  cycleChanged,
  option,
  cycle,
  currentPeriodEnd,
}: {
  preview: SubscriptionPlanPreview | null
  cycleChanged: boolean
  option: SubscriptionPlanOption | undefined
  cycle: SubscriptionBillingCycle
  currentPeriodEnd: string | null
}) {
  const cycleSuffix = cycleChanged ? `, cobrada no ciclo ${SUBSCRIPTION_BILLING_CYCLE_LABEL[cycle].toLowerCase()}` : ''
  const effectiveDate = preview?.current_period_end ?? currentPeriodEnd
  const newMonthlyPrice = preview?.monthly_price ?? option?.monthly_equivalent

  if (preview?.prorated_charge && preview.prorated_charge > 0) {
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
            {effectiveDate ? formatDate(effectiveDate) : 'sua próxima renovação'}, sua mensalidade passa a ser{' '}
            {newMonthlyPrice !== undefined ? currencyFormatter.format(newMonthlyPrice) : '—'}/mês{cycleSuffix}.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <AlertDescription>
        Nenhuma cobrança será feita agora.{' '}
        {effectiveDate
          ? `A partir de ${formatDate(effectiveDate)}, sua mensalidade passa a ser ${newMonthlyPrice !== undefined ? currencyFormatter.format(newMonthlyPrice) : '—'}/mês${cycleSuffix}.`
          : newMonthlyPrice !== undefined
            ? `Sua mensalidade passa a ser ${currencyFormatter.format(newMonthlyPrice)}/mês assim que a cobrança começar.`
            : ''}
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
            <p className="font-semibold">
              Plano {SUBSCRIPTION_PLAN_LABEL[subscription.plan]} ·{' '}
              {SUBSCRIPTION_BILLING_CYCLE_LABEL[subscription.billing_cycle]}
            </p>
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

function TemplateUsageCard() {
  const { data, isLoading, isError, error } = useTemplateUsage()
  const invoices = [...(data?.invoices ?? [])].sort((a, b) => compareDatesDesc(a.created_at, b.created_at))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Uso de mensagens WhatsApp</CardTitle>
        <CardDescription>
          Repasse do custo real que a Meta cobra por Template enviado (campanha, lembrete de agendamento, iniciar
          conversa) - sempre o valor exato, sem margem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError ? (
          <Alert variant="destructive">
            <AlertDescription>{error instanceof ApiError ? error.message : 'Erro ao carregar.'}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-md border bg-muted p-3 text-sm">
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              {data && data.summary.unbilled_message_count > 0 ? (
                <span>
                  <strong>{data.summary.unbilled_message_count}</strong>{' '}
                  {data.summary.unbilled_message_count === 1 ? 'mensagem enviada' : 'mensagens enviadas'} neste
                  período, ainda não faturada(s) - custo estimado até agora:{' '}
                  <strong>{currencyFormatter.format(data.summary.estimated_cost_brl)}</strong>. Entra numa fatura
                  consolidada mensal.
                </span>
              ) : (
                <span className="text-muted-foreground">Nenhuma mensagem de Template não-faturada neste período.</span>
              )}
            </div>

            {invoices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <Receipt className="h-8 w-8" />
                Nenhuma fatura de uso ainda
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <TemplateUsageInvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function TemplateUsageInvoiceRow({ invoice }: { invoice: TemplateUsageInvoice }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">{currencyFormatter.format(invoice.amount_brl)}</p>
          <Badge variant={templateUsageStatusVariant[invoice.status]}>
            {TEMPLATE_USAGE_INVOICE_STATUS_LABEL[invoice.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {invoice.message_count} {invoice.message_count === 1 ? 'mensagem' : 'mensagens'} · período{' '}
          {formatDate(invoice.period_start)} a {formatDate(invoice.period_end)}
        </p>
      </div>
      <Button type="button" variant="outline" asChild>
        <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
          Ver cobrança
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
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
