import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Info, Bot, CalendarClock } from 'lucide-react'
import { useAssistant, useCreateAssistant, useUpdateAssistant } from '@/hooks/useAssistant'
import { useCompany } from '@/hooks/useCompany'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import type { Assistant, AssistantStatus } from '@/types/assistant'

const assistantSchema = z.object({
  name: z.string().min(2, 'Informe pelo menos 2 caracteres').max(100, 'Máximo de 100 caracteres'),
  persona: z.string().min(1, 'Descreva a persona do assistente').max(4000, 'Máximo de 4000 caracteres'),
  company_context: z.string().min(1, 'Descreva o contexto da empresa').max(4000, 'Máximo de 4000 caracteres'),
  knowledge_context: z.string().max(8000, 'Máximo de 8000 caracteres').optional(),
  business_rules: z.string().min(1, 'Descreva as regras de negócio').max(4000, 'Máximo de 4000 caracteres'),
  transfer_rules: z.string().min(1, 'Descreva quando transferir pra um humano').max(4000, 'Máximo de 4000 caracteres'),
  tone_of_voice: z.string().min(1, 'Descreva o tom de voz').max(4000, 'Máximo de 4000 caracteres'),
  additional_instructions: z.string().max(8000, 'Máximo de 8000 caracteres').optional(),
  welcome_message: z.string().max(1000, 'Máximo de 1000 caracteres').optional(),
  transfer_message: z.string().max(1000, 'Máximo de 1000 caracteres').optional(),
})

type AssistantFormValues = z.infer<typeof assistantSchema>

const WELCOME_DEFAULT_MESSAGE = 'Olá! Seja bem-vindo(a). Como posso te ajudar hoje?'
const TRANSFER_DEFAULT_MESSAGE = 'Só um momento, vou te transferir para um de nossos atendentes.'

export function AssistantPage() {
  const { data: assistant, isLoading, isError, error } = useAssistant()
  const createAssistant = useCreateAssistant()
  const updateAssistant = useUpdateAssistant()
  const { toast } = useToast()

  const notFound = isError && error instanceof ApiError && error.status === 404

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assistente IA</h1>
        <p className="text-sm text-muted-foreground">Configure como a IA se apresenta no primeiro atendimento</p>
      </div>

      <Alert>
        <Info />
        <AlertTitle>Mecanismo pronto, aguardando o fluxo do n8n</AlertTitle>
        <AlertDescription>
          O backend já aciona automaticamente o fluxo de IA a cada mensagem nova — só falta a etapa de configuração
          dentro do n8n (fora deste sistema). Criar um assistente aqui é opcional: sem ele, sua empresa ainda usa o
          WhatsApp normalmente, só que toda mensagem já chega direto pro atendimento humano.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : notFound ? (
        <AssistantForm
          mode="create"
          defaultValues={{
            name: '',
            persona: '',
            company_context: '',
            knowledge_context: '',
            business_rules: '',
            transfer_rules: '',
            tone_of_voice: '',
            additional_instructions: '',
            welcome_message: WELCOME_DEFAULT_MESSAGE,
            transfer_message: TRANSFER_DEFAULT_MESSAGE,
          }}
          onSubmit={(data) => createAssistant.mutateAsync(data)}
        />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertDescription>{error instanceof ApiError ? error.message : 'Erro ao carregar.'}</AlertDescription>
        </Alert>
      ) : (
        assistant && (
          <>
            <StatusCard assistant={assistant} />
            <SchedulingCard assistant={assistant} />

            <AssistantForm
              mode="edit"
              defaultValues={{
                name: assistant.name,
                persona: assistant.persona,
                company_context: assistant.company_context,
                knowledge_context: assistant.knowledge_context ?? '',
                business_rules: assistant.business_rules,
                transfer_rules: assistant.transfer_rules,
                tone_of_voice: assistant.tone_of_voice,
                additional_instructions: assistant.additional_instructions ?? '',
                welcome_message: assistant.welcome_message ?? WELCOME_DEFAULT_MESSAGE,
                transfer_message: assistant.transfer_message ?? TRANSFER_DEFAULT_MESSAGE,
              }}
              onSubmit={async (data) => {
                await updateAssistant.mutateAsync(data)
                toast({ title: 'Assistente atualizado', variant: 'success' })
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prompt compilado</CardTitle>
                <CardDescription>Gerado automaticamente pelo sistema — somente leitura</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  {assistant.compiled_prompt || 'Ainda não gerado.'}
                </pre>
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  )
}

function StatusCard({ assistant }: { assistant: Assistant }) {
  const updateAssistant = useUpdateAssistant()
  const { toast } = useToast()
  const isActive = assistant.status === 'ACTIVE'

  async function handleToggle(checked: boolean) {
    const nextStatus: AssistantStatus = checked ? 'ACTIVE' : 'INACTIVE'
    try {
      await updateAssistant.mutateAsync({ status: nextStatus })
      toast({ title: checked ? 'IA ativada' : 'IA desativada', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Não foi possível alterar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <Card notch="tr">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="btn-cut-sm flex h-11 w-11 shrink-0 items-center justify-center bg-brand-600 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{isActive ? 'IA ativada nesta empresa' : 'IA desativada nesta empresa'}</p>
          <p className="text-sm text-muted-foreground">
            {isActive
              ? 'A IA responde o primeiro atendimento até um humano assumir a conversa.'
              : 'A IA não responde — toda mensagem já chega marcada pro atendimento humano.'}
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={handleToggle} disabled={updateAssistant.isPending} />
      </CardContent>
    </Card>
  )
}

function SchedulingCard({ assistant }: { assistant: Assistant }) {
  const { data: company } = useCompany()
  const updateAssistant = useUpdateAssistant()
  const { toast } = useToast()
  const [instructions, setInstructions] = useState(assistant.scheduling_instructions ?? '')

  useEffect(() => setInstructions(assistant.scheduling_instructions ?? ''), [assistant.scheduling_instructions])

  const schedulingEnabled = !!company?.scheduling_enabled
  const assistantActive = assistant.status === 'ACTIVE'
  const canToggle = schedulingEnabled && assistantActive

  async function handleToggle(checked: boolean) {
    try {
      await updateAssistant.mutateAsync({ can_schedule_appointments: checked })
      toast({ title: checked ? 'IA pode marcar horário agora' : 'IA não marca mais horário', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Não foi possível alterar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleSaveInstructions() {
    try {
      await updateAssistant.mutateAsync({ scheduling_instructions: instructions || undefined })
      toast({ title: 'Regras de agendamento atualizadas' })
    } catch (error) {
      toast({
        title: 'Não foi possível atualizar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4" />
          Agendamento por IA
        </CardTitle>
        <CardDescription>
          {schedulingEnabled
            ? 'A IA pode marcar horários reais na Agenda durante a conversa, sempre pedindo confirmação antes.'
            : 'Ative a Agenda em Minha Empresa para poder ligar isso aqui.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="can_schedule">A IA pode marcar horário</Label>
          <Switch
            id="can_schedule"
            checked={assistant.can_schedule_appointments}
            onCheckedChange={handleToggle}
            disabled={!canToggle || updateAssistant.isPending}
          />
        </div>
        {schedulingEnabled && !assistantActive && (
          <p className="text-xs text-muted-foreground">A IA precisa estar ativada (interruptor no topo) pra poder agendar.</p>
        )}
        {assistant.can_schedule_appointments && (
          <div className="space-y-1.5">
            <Label htmlFor="scheduling_instructions">Regras de agendamento (opcional)</Label>
            <Textarea
              id="scheduling_instructions"
              rows={3}
              placeholder="Ex: nunca marque no mesmo dia, sempre confirme o nome completo antes de finalizar"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveInstructions}
              disabled={updateAssistant.isPending || instructions === (assistant.scheduling_instructions ?? '')}
            >
              Salvar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AssistantForm({
  mode,
  defaultValues,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  defaultValues?: AssistantFormValues
  onSubmit: (data: AssistantFormValues) => Promise<unknown>
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AssistantFormValues>({ resolver: zodResolver(assistantSchema), defaultValues })

  async function handle(data: AssistantFormValues) {
    setFormError(null)
    try {
      await onSubmit({
        ...data,
        knowledge_context: data.knowledge_context || undefined,
        additional_instructions: data.additional_instructions || undefined,
        welcome_message: data.welcome_message === WELCOME_DEFAULT_MESSAGE ? undefined : data.welcome_message || undefined,
        transfer_message: data.transfer_message === TRANSFER_DEFAULT_MESSAGE ? undefined : data.transfer_message || undefined,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        const knownFields: (keyof AssistantFormValues)[] = [
          'name',
          'persona',
          'company_context',
          'knowledge_context',
          'business_rules',
          'transfer_rules',
          'tone_of_voice',
          'additional_instructions',
          'welcome_message',
          'transfer_message',
        ]
        let matchedField = false
        for (const field of knownFields) {
          if (error.fieldErrors[field]) {
            setError(field, { message: error.fieldErrors[field] })
            matchedField = true
          }
        }
        if (!matchedField) setFormError(error.message)
      } else {
        setFormError('Ocorreu um erro inesperado. Tente novamente.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {mode === 'create' && (
        <Alert>
          <AlertDescription>
            Criar o assistente é opcional. Se sua empresa quiser usar a plataforma só pra organizar o WhatsApp, sem
            IA nenhuma, não precisa preencher isso agora — pode voltar aqui quando quiser.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identidade do assistente</CardTitle>
          <CardDescription>Como ele se chama e se comporta ao conversar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Ex: Aria" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="persona">Persona</Label>
            <Textarea
              id="persona"
              rows={3}
              placeholder="Ex: atendente simpática e objetiva, sempre confirma os dados antes de agendar"
              {...register('persona')}
            />
            {errors.persona && <p className="text-xs text-destructive">{errors.persona.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tone_of_voice">Tom de voz</Label>
            <Textarea
              id="tone_of_voice"
              rows={2}
              placeholder="Ex: informal, direto, sem gírias, sempre trata o cliente por você"
              {...register('tone_of_voice')}
            />
            {errors.tone_of_voice && <p className="text-xs text-destructive">{errors.tone_of_voice.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contexto do negócio</CardTitle>
          <CardDescription>O que a IA precisa saber sobre sua empresa pra responder bem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="company_context">Sobre a empresa</Label>
            <Textarea
              id="company_context"
              rows={4}
              placeholder="Ex: somos uma academia com aulas de natação e musculação, funcionamos de segunda a sábado"
              {...register('company_context')}
            />
            {errors.company_context && <p className="text-xs text-destructive">{errors.company_context.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="knowledge_context">Conhecimento adicional (opcional)</Label>
            <Textarea
              id="knowledge_context"
              rows={4}
              placeholder="Ex: preços, horários detalhados, perguntas frequentes"
              {...register('knowledge_context')}
            />
            {errors.knowledge_context && <p className="text-xs text-destructive">{errors.knowledge_context.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regras de atendimento</CardTitle>
          <CardDescription>O que a IA pode decidir sozinha e quando deve chamar um humano</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="business_rules">Regras de negócio</Label>
            <Textarea
              id="business_rules"
              rows={4}
              placeholder="Ex: só confirme agendamento se o cliente informar nome completo e horário desejado"
              {...register('business_rules')}
            />
            {errors.business_rules && <p className="text-xs text-destructive">{errors.business_rules.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transfer_rules">Quando transferir pra um humano</Label>
            <Textarea
              id="transfer_rules"
              rows={3}
              placeholder="Ex: transferir se o cliente reclamar, pedir reembolso, ou perguntar algo fora do escopo"
              {...register('transfer_rules')}
            />
            {errors.transfer_rules && <p className="text-xs text-destructive">{errors.transfer_rules.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="additional_instructions">Instruções adicionais (opcional)</Label>
            <Textarea id="additional_instructions" rows={3} {...register('additional_instructions')} />
            {errors.additional_instructions && (
              <p className="text-xs text-destructive">{errors.additional_instructions.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensagens automáticas (opcional)</CardTitle>
          <CardDescription>Já vem preenchido com o texto padrão da plataforma — edite se quiser personalizar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="welcome_message">Mensagem de boas-vindas</Label>
            <Textarea id="welcome_message" rows={2} {...register('welcome_message')} />
            {errors.welcome_message && <p className="text-xs text-destructive">{errors.welcome_message.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transfer_message">Mensagem ao transferir pra um humano</Label>
            <Textarea id="transfer_message" rows={2} {...register('transfer_message')} />
            {errors.transfer_message && <p className="text-xs text-destructive">{errors.transfer_message.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === 'create' ? 'Criar assistente' : 'Salvar alterações'}
      </Button>
    </form>
  )
}
