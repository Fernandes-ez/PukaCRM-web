import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, Megaphone, Users } from 'lucide-react'
import { usePipeline } from '@/hooks/usePipeline'
import { useMessageTemplates } from '@/hooks/useMessageTemplates'
import { useCampaignPreview, useCreateCampaign } from '@/hooks/useCampaigns'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageTemplateButtonsPreview } from '@/components/message-template-buttons-preview'
import { cn } from '@/utils/cn'
import { LEAD_GENDER_LABEL, type LeadGender } from '@/types/lead'
import type { CampaignFilters } from '@/types/campaign'

const MONTH_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ANY = '__any__'

type Step = 'filters' | 'template' | 'confirm'

const STEPS: { key: Step; label: string }[] = [
  { key: 'filters', label: 'Filtros' },
  { key: 'template', label: 'Template' },
  { key: 'confirm', label: 'Confirmar' },
]

function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
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
              <div className={cn('mx-3 h-px w-10 sm:w-16', isDone ? 'bg-brand-600' : 'bg-border')} />
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

  // Busca a contagem toda vez que um filtro muda, com um pequeno debounce -
  // evita disparar uma chamada a cada tecla digitada nos campos de idade.
  useEffect(() => {
    const timeout = setTimeout(() => preview.mutate(filters), 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const approvedTemplates = useMemo(() => templates?.filter((t) => t.status === 'APPROVED') ?? [], [templates])
  const selectedTemplate = approvedTemplates.find((t) => t.id === templateId)

  async function handleCreate() {
    if (!templateId || !name.trim()) return
    setFormError(null)
    try {
      await createCampaign.mutateAsync({ name: name.trim(), message_template_id: templateId, filters })
      toast({ title: 'Campanha criada - envio já começou', variant: 'success' })
      navigate('/campanhas')
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  const count = preview.data?.count ?? 0

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        to="/campanhas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar pras Campanhas
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova campanha</h1>
        <p className="text-sm text-muted-foreground">Filtre o público e escolha o template pra disparar em massa</p>
      </div>

      <Stepper current={step} />

      <Card>
        {step === 'filters' && (
          <>
            <CardHeader>
              <CardTitle className="text-base">Filtros</CardTitle>
              <CardDescription>Filtre o público que vai receber a mensagem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="space-y-1.5">
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
                Leads que já pediram pra não receber campanha nunca entram, mesmo se baterem no filtro.
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
                </>
              )}

              <div className="flex justify-between border-t pt-4">
                <Button type="button" variant="ghost" onClick={() => setStep('filters')}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button type="button" disabled={!templateId} onClick={() => setStep('confirm')}>
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
              <div className="rounded-md border p-3 text-sm">
                <p>
                  <strong>{count}</strong> {count === 1 ? 'destinatário' : 'destinatários'}
                </p>
                <p className="text-muted-foreground">Template: {selectedTemplate?.name}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                O envio começa logo após confirmar e roda em segundo plano, com throttling - acompanhe o progresso na
                lista de campanhas.
              </p>

              <div className="flex justify-between border-t pt-4">
                <Button type="button" variant="ghost" onClick={() => setStep('template')}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button type="button" disabled={!name.trim() || createCampaign.isPending} onClick={handleCreate}>
                  {createCampaign.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Megaphone className="h-4 w-4" />
                  )}
                  Disparar campanha
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
