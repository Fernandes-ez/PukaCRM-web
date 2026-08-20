import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar as CalendarIcon, Check, Clock, Loader2, Megaphone, Repeat, Send, Users } from 'lucide-react'
import { usePipeline } from '@/hooks/usePipeline'
import { useMessageTemplates } from '@/hooks/useMessageTemplates'
import { useCampaignPreview, useCreateCampaign } from '@/hooks/useCampaigns'
import { useBillingGate } from '@/hooks/useBillingGate'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageTemplateButtonsPreview } from '@/components/message-template-buttons-preview'
import { cn } from '@/utils/cn'
import { LEAD_GENDER_LABEL, type LeadGender } from '@/types/lead'
import { WEEKDAY_LABEL, type CampaignFilters } from '@/types/campaign'

const MONTH_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ANY = '__any__'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

type SendMode = 'now' | 'schedule' | 'recurring'

const SEND_MODE_OPTIONS: { value: SendMode; label: string; description: string; icon: typeof Send }[] = [
  { value: 'now', label: 'Agora', description: 'Começa a enviar assim que confirmar', icon: Send },
  { value: 'schedule', label: 'Agendar', description: 'Escolha uma data e hora futuras', icon: CalendarIcon },
  { value: 'recurring', label: 'Repetir', description: 'Em dias da semana, até uma data final', icon: Repeat },
]

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hours || 0, minutes || 0, 0, 0)
  return combined
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

type Step = 'filters' | 'template' | 'schedule' | 'confirm'

const STEPS: { key: Step; label: string }[] = [
  { key: 'filters', label: 'Filtros' },
  { key: 'template', label: 'Template' },
  { key: 'schedule', label: 'Agendamento' },
  { key: 'confirm', label: 'Confirmar' },
]

function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center" role="list" aria-label="Etapas da criação da campanha">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <div key={step.key} role="listitem" className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isDone && 'bg-brand-600 text-white',
                  isCurrent && 'border-2 border-brand-600 text-brand-600',
                  !isDone && !isCurrent && 'border border-border text-muted-foreground',
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span className={cn('text-sm', isCurrent ? 'font-medium' : 'text-muted-foreground')}>{step.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn('mx-3 h-px w-8 sm:w-12', isDone ? 'bg-brand-600' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function CreateCampaignPage() {
  const { data: pipeline } = usePipeline()
  const { data: templates } = useMessageTemplates()
  const preview = useCampaignPreview()
  const createCampaign = useCreateCampaign()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('filters')
  const [gender, setGender] = useState<LeadGender | typeof ANY>(ANY)
  const [minAge, setMinAge] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [birthdayMonth, setBirthdayMonth] = useState<string>(ANY)
  const [pipelineStageId, setPipelineStageId] = useState<string>(ANY)
  const [templateId, setTemplateId] = useState('')
  const [name, setName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [sendMode, setSendMode] = useState<SendMode>('now')
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null)
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null)

  function toggleRecurrenceDay(day: number, checked: boolean) {
    setRecurrenceDays((prev) => (checked ? [...prev, day].sort() : prev.filter((d) => d !== day)))
  }

  const filters: CampaignFilters = useMemo(
    () => ({
      gender: gender === ANY ? null : gender,
      min_age: minAge ? Number(minAge) : null,
      max_age: maxAge ? Number(maxAge) : null,
      birthday_month: birthdayMonth === ANY ? null : Number(birthdayMonth),
      pipeline_stage_id: pipelineStageId === ANY ? null : pipelineStageId,
    }),
    [gender, minAge, maxAge, birthdayMonth, pipelineStageId],
  )

  // Busca a contagem (e o custo estimado, depois que um template é
  // escolhido) toda vez que filtro ou template mudam, com um pequeno
  // debounce - evita disparar uma chamada a cada tecla digitada nos
  // campos de idade.
  useEffect(() => {
    const timeout = setTimeout(() => preview.mutate({ filters, template_id: templateId || null }), 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, templateId])

  const approvedTemplates = useMemo(() => templates?.filter((t) => t.status === 'APPROVED') ?? [], [templates])
  const selectedTemplate = approvedTemplates.find((t) => t.id === templateId)

  const scheduleValid = sendMode === 'now' || scheduleDate !== null
  const recurrenceValid = sendMode !== 'recurring' || (recurrenceDays.length > 0 && recurrenceEndDate !== null)
  const canAdvanceFromSchedule = scheduleValid && recurrenceValid
  const {
    blocked: billingBlocked,
    reason: billingBlockedReason,
    templateUsageOverdue,
    templateUsageReason,
  } = useBillingGate()
  const canSubmit = name.trim() !== '' && canAdvanceFromSchedule && !billingBlocked && !templateUsageOverdue

  async function handleCreate() {
    if (!templateId || !canSubmit) return
    setFormError(null)
    try {
      await createCampaign.mutateAsync({
        name: name.trim(),
        message_template_id: templateId,
        filters,
        scheduled_at: sendMode === 'now' || !scheduleDate ? null : combineDateAndTime(scheduleDate, scheduleTime).toISOString(),
        recurrence_days_of_week: sendMode === 'recurring' ? recurrenceDays : null,
        recurrence_end_date: sendMode === 'recurring' && recurrenceEndDate ? recurrenceEndDate.toISOString().slice(0, 10) : null,
      })
      toast({
        title:
          sendMode === 'now'
            ? 'Campanha criada - envio já começou'
            : sendMode === 'schedule'
              ? 'Campanha agendada'
              : 'Campanha recorrente criada',
        variant: 'success',
      })
      navigate('/campanhas')
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  const count = preview.data?.count ?? 0
  const estimatedCostBrl = preview.data?.estimated_cost_brl ?? null

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/campanhas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar pras Campanhas
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova campanha</h1>
        <p className="text-sm text-muted-foreground">Filtre o público, escolha o template e quando disparar</p>
      </div>

      {billingBlocked && (
        <Alert variant="destructive">
          <AlertDescription>{billingBlockedReason}</AlertDescription>
        </Alert>
      )}
      {!billingBlocked && templateUsageOverdue && (
        <Alert variant="destructive">
          <AlertDescription>{templateUsageReason}</AlertDescription>
        </Alert>
      )}

      <Stepper current={step} />

      <Card>
        {step === 'filters' && (
          <>
            <CardHeader>
              <CardTitle className="text-base">Filtros</CardTitle>
              <CardDescription>Filtre o público que vai receber a mensagem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Sexo</Label>
                  <Select value={gender} onValueChange={(value) => setGender(value as LeadGender | typeof ANY)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Qualquer</SelectItem>
                      {(Object.keys(LEAD_GENDER_LABEL) as LeadGender[]).map((value) => (
                        <SelectItem key={value} value={value}>
                          {LEAD_GENDER_LABEL[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Mês de aniversário</Label>
                  <Select value={birthdayMonth} onValueChange={setBirthdayMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Qualquer</SelectItem>
                      {MONTH_LABEL.map((label, index) => (
                        <SelectItem key={label} value={String(index + 1)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign_min_age">Idade mínima</Label>
                  <Input
                    id="campaign_min_age"
                    type="number"
                    min={0}
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="Sem mínimo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign_max_age">Idade máxima</Label>
                  <Input
                    id="campaign_max_age"
                    type="number"
                    min={0}
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder="Sem máximo"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:max-w-xs">
                <Label>Estágio do pipeline</Label>
                <Select value={pipelineStageId} onValueChange={setPipelineStageId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Qualquer</SelectItem>
                    {pipeline?.stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 rounded-md border bg-muted p-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                {preview.isPending ? (
                  <span className="text-muted-foreground">Contando...</span>
                ) : (
                  <span>
                    <strong>{count}</strong> {count === 1 ? 'contato corresponde' : 'contatos correspondem'} a esse
                    filtro
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Leads que já pediram pra não receber campanha, ou que já têm uma conversa em andamento (com humano
                ou com a IA), nunca entram, mesmo se baterem no filtro.
              </p>

              <div className="flex justify-between border-t pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/campanhas')}>
                  Cancelar
                </Button>
                <Button type="button" disabled={count === 0 || preview.isPending} onClick={() => setStep('template')}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'template' && (
          <>
            <CardHeader>
              <CardTitle className="text-base">Escolher template</CardTitle>
              <CardDescription>
                Fora da janela de atendimento de 24h, só um Message Template aprovado pode iniciar contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvedTemplates.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Nenhum template aprovado ainda. Cadastre um em WhatsApp → Templates de Mensagem e aguarde a
                    aprovação da Meta.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Template</Label>
                    <Select value={templateId} onValueChange={setTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um template aprovado" />
                      </SelectTrigger>
                      <SelectContent>
                        {approvedTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <div className="space-y-1.5">
                      <Label>Pré-visualização</Label>
                      <p className="whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm">
                        {selectedTemplate.body_text}
                      </p>
                      <MessageTemplateButtonsPreview buttons={selectedTemplate.buttons} />
                      <p className="text-xs text-muted-foreground">
                        As variáveis (nome, telefone etc.) são preenchidas individualmente pra cada contato no
                        momento do envio.
                      </p>
                    </div>
                  )}

                  {selectedTemplate && (
                    <Alert variant="warning">
                      <AlertDescription>
                        {preview.isPending ? (
                          'Calculando custo estimado...'
                        ) : estimatedCostBrl !== null ? (
                          <>
                            Esse envio custa <strong>{currencyFormatter.format(estimatedCostBrl)}</strong> à Meta
                            (repasse exato, sem margem - {count} {count === 1 ? 'contato' : 'contatos'} ×
                            template de {preview.data?.template_category === 'MARKETING' ? 'Marketing' : 'Utility'}).
                            Esse valor entra na sua próxima fatura de uso de mensagens.
                          </>
                        ) : (
                          'Não foi possível calcular o custo estimado agora.'
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              <div className="flex justify-between border-t pt-4">
                <Button type="button" variant="ghost" onClick={() => setStep('filters')}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button type="button" disabled={!templateId} onClick={() => setStep('schedule')}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'schedule' && (
          <>
            <CardHeader>
              <CardTitle className="text-base">Agendamento</CardTitle>
              <CardDescription>Decida quando o disparo acontece.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Quando enviar</legend>
                <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Quando enviar">
                  {SEND_MODE_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const checked = sendMode === option.value
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          'flex cursor-pointer flex-col gap-1.5 rounded-lg border p-4 text-sm transition-colors hover:bg-accent',
                          checked && 'border-brand-600 bg-brand-600/5 ring-1 ring-brand-600',
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <input
                            type="radio"
                            name="send_mode"
                            value={option.value}
                            checked={checked}
                            onChange={() => setSendMode(option.value)}
                            className="h-4 w-4 accent-brand-600"
                          />
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              {sendMode === 'now' && (
                <Alert>
                  <Send className="h-4 w-4" />
                  <AlertDescription>
                    O envio começa logo após confirmar e roda em segundo plano, com throttling - acompanhe o
                    progresso na lista de campanhas.
                  </AlertDescription>
                </Alert>
              )}

              {sendMode === 'schedule' && (
                <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
                  <div className="space-y-1.5">
                    <Label id="campaign_schedule_date_label">Data do disparo</Label>
                    <Calendar value={scheduleDate} onChange={setScheduleDate} minDate={new Date()} aria-label="Data do disparo" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex max-w-[10rem] items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Label htmlFor="campaign_schedule_time" className="sr-only">
                        Horário do disparo
                      </Label>
                      <Input
                        id="campaign_schedule_time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                    {scheduleDate ? (
                      <Alert>
                        <CalendarIcon className="h-4 w-4" />
                        <AlertDescription aria-live="polite">
                          Disparo agendado pra <strong>{formatDateLabel(scheduleDate)}</strong>, às{' '}
                          <strong>{scheduleTime}</strong>. O público é calculado agora, na criação - não é
                          recalculado na hora do disparo.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <p className="text-sm text-muted-foreground">Escolha uma data no calendário ao lado.</p>
                    )}
                  </div>
                </div>
              )}

              {sendMode === 'recurring' && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label id="campaign_schedule_date_label">Data de início</Label>
                    <Calendar value={scheduleDate} onChange={setScheduleDate} minDate={new Date()} aria-label="Data de início" />
                    <div className="flex max-w-[10rem] items-center gap-2 pt-1">
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Label htmlFor="campaign_schedule_time" className="sr-only">
                        Horário do disparo diário
                      </Label>
                      <Input
                        id="campaign_schedule_time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <fieldset className="space-y-1.5">
                      <legend className="text-sm font-medium">Repetir toda(o)</legend>
                      <div className="flex flex-wrap gap-3">
                        {WEEKDAY_LABEL.map((label, index) => (
                          <label key={label} className="flex items-center gap-1.5 text-sm">
                            <Checkbox
                              checked={recurrenceDays.includes(index)}
                              onCheckedChange={(checked) => toggleRecurrenceDay(index, checked === true)}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div className="space-y-1.5">
                      <Label id="campaign_recurrence_end_label">Repetir até</Label>
                      <Calendar
                        value={recurrenceEndDate}
                        onChange={setRecurrenceEndDate}
                        minDate={scheduleDate ?? new Date()}
                        aria-label="Repetir até"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    {scheduleDate && recurrenceDays.length > 0 && recurrenceEndDate ? (
                      <Alert>
                        <Repeat className="h-4 w-4" />
                        <AlertDescription aria-live="polite">
                          Toda(o) <strong>{recurrenceDays.map((d) => WEEKDAY_LABEL[d]).join(', ')}</strong>, a
                          partir de <strong>{formatDateLabel(scheduleDate)}</strong> às{' '}
                          <strong>{scheduleTime}</strong>, até <strong>{formatDateLabel(recurrenceEndDate)}</strong>.
                          O público é recalculado a cada ocorrência - ideal pra algo como "toda quinta,
                          aniversariantes do dia". Uma pessoa nunca recebe a mesma campanha 2 vezes, mesmo batendo
                          em várias ocorrências.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Escolha a data de início, os dias da semana e até quando repetir.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between border-t pt-4">
                <Button type="button" variant="ghost" onClick={() => setStep('template')}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button type="button" disabled={!canAdvanceFromSchedule} onClick={() => setStep('confirm')}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'confirm' && (
          <>
            <CardHeader>
              <CardTitle className="text-base">Confirmar campanha</CardTitle>
              <CardDescription>Dê um nome pra identificar essa campanha depois.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="campaign_name">Nome da campanha</Label>
                <Input
                  id="campaign_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aniversariantes de agosto"
                />
              </div>
              <div className="space-y-1 rounded-md border p-3 text-sm">
                <p>
                  <strong>{count}</strong> {count === 1 ? 'destinatário' : 'destinatários'}
                </p>
                <p className="text-muted-foreground">Template: {selectedTemplate?.name}</p>
                <p className="text-muted-foreground">
                  {sendMode === 'now' && 'Envio: assim que confirmar'}
                  {sendMode === 'schedule' &&
                    scheduleDate &&
                    `Agendada pra ${formatDateLabel(scheduleDate)}, às ${scheduleTime}`}
                  {sendMode === 'recurring' &&
                    scheduleDate &&
                    recurrenceEndDate &&
                    `Recorrente: toda(o) ${recurrenceDays.map((d) => WEEKDAY_LABEL[d]).join(', ')}, a partir de ${formatDateLabel(scheduleDate)} às ${scheduleTime}, até ${formatDateLabel(recurrenceEndDate)}`}
                </p>
              </div>

              {estimatedCostBrl !== null && (
                <Alert variant="warning">
                  <AlertDescription>
                    Custo estimado desse disparo: <strong>{currencyFormatter.format(estimatedCostBrl)}</strong>{' '}
                    (repasse do custo real cobrado pela Meta, sem margem). Entra na sua próxima fatura de uso de
                    mensagens.
                    {sendMode === 'recurring' &&
                      ' Como é recorrente, cada nova ocorrência gera um custo semelhante.'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between border-t pt-4">
                <Button type="button" variant="ghost" onClick={() => setStep('schedule')}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button type="button" disabled={!canSubmit || createCampaign.isPending} onClick={handleCreate}>
                  {createCampaign.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Megaphone className="h-4 w-4" />
                  )}
                  {sendMode === 'now' ? 'Disparar campanha' : sendMode === 'schedule' ? 'Agendar campanha' : 'Criar campanha recorrente'}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
