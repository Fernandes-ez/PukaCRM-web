import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2, Tag, ArrowRight, Link2, Phone, MessageSquareReply } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMessageTemplates, useCreateMessageTemplate, useDeleteMessageTemplate } from '@/hooks/useMessageTemplates'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  MESSAGE_TEMPLATE_BUTTON_TYPE_LABEL,
  MESSAGE_TEMPLATE_CATEGORY_LABEL,
  MESSAGE_TEMPLATE_STATUS_LABEL,
  MESSAGE_TEMPLATE_VARIABLE_SOURCES,
  MESSAGE_TEMPLATE_VARIABLE_SOURCE_LABEL,
  MESSAGE_TEMPLATE_VARIABLE_TOKEN,
  type MessageTemplate,
  type MessageTemplateButton,
  type MessageTemplateCategory,
  type MessageTemplateStatus,
  type MessageTemplateVariableSource,
} from '@/types/messageTemplate'

const statusVariant: Record<MessageTemplateStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'destructive',
  PAUSED: 'secondary',
  DISABLED: 'secondary',
}

const quickReplySchema = z.object({
  text: z.string().min(1, 'Informe o texto').max(25, 'Máx. 25 caracteres'),
})

const actionButtonSchema = z
  .object({
    type: z.enum(['URL', 'PHONE_NUMBER']),
    text: z.string().min(1, 'Informe o texto').max(25, 'Máx. 25 caracteres'),
    url: z.string().max(2000).optional(),
    phone_number: z.string().max(20).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'URL') {
      if (!data.url) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: 'Informe a URL' })
      } else if (!data.url.startsWith('https://')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: 'A URL precisa começar com https://' })
      }
    }
    if (data.type === 'PHONE_NUMBER' && !data.phone_number) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone_number'], message: 'Informe o telefone' })
    }
  })

const schema = z.object({
  name: z
    .string()
    .min(1, 'Informe o nome')
    .regex(/^[a-z0-9_]+$/, 'Só minúsculas, números e underscore (ex: promo_verao)'),
  language: z.string().min(2, 'Informe o idioma'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  body_text: z.string().min(1, 'Informe o corpo da mensagem'),
  footer_text: z.string().optional(),
  quick_replies: z.array(quickReplySchema).max(10),
  action_buttons: z.array(actionButtonSchema).max(10),
})
type FormValues = z.infer<typeof schema>

/** Mesmos limites que o backend valida (MessageTemplateCreate) - checado no submit pra dar feedback sem round-trip. */
function validateButtonLimits(data: FormValues): string | null {
  if (data.quick_replies.length + data.action_buttons.length > 10) return 'Templates aceitam no máximo 10 botões.'
  if (data.action_buttons.filter((b) => b.type === 'URL').length > 2) return 'Templates aceitam no máximo 2 botões de link.'
  if (data.action_buttons.filter((b) => b.type === 'PHONE_NUMBER').length > 1) {
    return 'Templates aceitam no máximo 1 botão de telefone.'
  }
  return null
}

/** Quais fontes já aparecem no texto - espelha detect_variable_sources do backend. */
function detectVariableSources(text: string): Set<MessageTemplateVariableSource> {
  const used = new Set<MessageTemplateVariableSource>()
  for (const source of MESSAGE_TEMPLATE_VARIABLE_SOURCES) {
    if (text.includes(`{{${MESSAGE_TEMPLATE_VARIABLE_TOKEN[source]}}}`)) used.add(source)
  }
  return used
}

export function MessageTemplatesPage() {
  const { data: templates, isLoading } = useMessageTemplates()
  const createTemplate = useCreateMessageTemplate()
  const deleteTemplate = useDeleteMessageTemplate()
  const { hasPermission } = useAuth()
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MessageTemplate | null>(null)

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id)
      toast({ title: 'Template excluído', variant: 'success' })
      setDeleteTarget(null)
    } catch (error) {
      toast({
        title: 'Não foi possível excluir',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates de Mensagem</h1>
          <p className="text-sm text-muted-foreground">
            Únicos aprovados pela Meta que podem iniciar uma conversa com um Lead fora da janela de atendimento de
            24h
          </p>
        </div>
        <Link
          to="/whatsapp/templates/ajuda"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Como evitar rejeição da Meta
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Seus templates</CardTitle>
            <CardDescription>Precisam de um WABA ID configurado em WhatsApp pra poderem ser criados</CardDescription>
          </div>
          {hasPermission('WHATSAPP', 'message_template', 'CREATE') && (
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo template
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : templates?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum template cadastrado ainda.</p>
          ) : (
            templates?.map((template) => (
              <div key={template.id} className="flex items-start justify-between gap-2 rounded-md border p-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{template.name}</span>
                    <Badge variant={statusVariant[template.status]}>
                      {MESSAGE_TEMPLATE_STATUS_LABEL[template.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {MESSAGE_TEMPLATE_CATEGORY_LABEL[template.category]} · {template.language}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{template.body_text}</p>
                  {template.variables_used.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {template.variables_used.map((source) => (
                        <Badge key={source} variant="outline" className="text-[10px] font-normal">
                          {MESSAGE_TEMPLATE_VARIABLE_SOURCE_LABEL[source]}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {template.buttons.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {template.buttons.map((button, index) => (
                        <Badge key={index} variant="secondary" className="gap-1 text-[10px] font-normal">
                          {button.type === 'URL' ? (
                            <Link2 className="h-3 w-3" />
                          ) : button.type === 'PHONE_NUMBER' ? (
                            <Phone className="h-3 w-3" />
                          ) : (
                            <MessageSquareReply className="h-3 w-3" />
                          )}
                          {button.text}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {template.status === 'REJECTED' && template.rejected_reason && (
                    <p className="text-xs text-destructive">Motivo: {template.rejected_reason}</p>
                  )}
                </div>
                {hasPermission('WHATSAPP', 'message_template', 'DELETE') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(template)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} createTemplate={createTemplate} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir template"
        description={`Excluir o template "${deleteTarget?.name}"? Isso também libera o nome na Meta.`}
        confirmLabel="Excluir"
        variant="destructive"
        isPending={deleteTemplate.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function CreateTemplateDialog({
  open,
  onOpenChange,
  createTemplate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  createTemplate: ReturnType<typeof useCreateMessageTemplate>
}) {
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { language: 'pt_BR', category: 'UTILITY', quick_replies: [], action_buttons: [] },
  })
  const { ref: bodyRegisterRef, ...bodyRegisterRest } = register('body_text')

  const {
    fields: quickReplyFields,
    append: appendQuickReply,
    remove: removeQuickReply,
  } = useFieldArray({ control, name: 'quick_replies' })
  const {
    fields: actionButtonFields,
    append: appendActionButton,
    remove: removeActionButton,
  } = useFieldArray({ control, name: 'action_buttons' })

  const category = watch('category')
  const bodyText = watch('body_text') ?? ''
  const usedSources = detectVariableSources(bodyText)

  const quickReplies = watch('quick_replies') ?? []
  const actionButtons = watch('action_buttons') ?? []
  const urlButtonCount = actionButtons.filter((b) => b.type === 'URL').length
  const phoneButtonCount = actionButtons.filter((b) => b.type === 'PHONE_NUMBER').length
  const totalButtonCount = quickReplies.length + actionButtons.length

  function insertVariable(source: MessageTemplateVariableSource) {
    const token = `{{${MESSAGE_TEMPLATE_VARIABLE_TOKEN[source]}}}`
    const el = bodyRef.current
    const start = el?.selectionStart ?? bodyText.length
    const end = el?.selectionEnd ?? bodyText.length
    const newText = bodyText.slice(0, start) + token + bodyText.slice(end)
    setValue('body_text', newText, { shouldValidate: true, shouldDirty: true })
    if (el) {
      requestAnimationFrame(() => {
        el.focus()
        const cursor = start + token.length
        el.setSelectionRange(cursor, cursor)
      })
    }
  }

  /** A Meta só aceita a variável no FINAL da URL - sem cursor, só concatena. */
  function insertUrlVariable(index: number, source: MessageTemplateVariableSource) {
    const current = watch(`action_buttons.${index}.url`) ?? ''
    setValue(`action_buttons.${index}.url`, current + `{{${MESSAGE_TEMPLATE_VARIABLE_TOKEN[source]}}}`, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  function hasAnyToken(text: string): boolean {
    return MESSAGE_TEMPLATE_VARIABLE_SOURCES.some((source) => text.includes(`{{${MESSAGE_TEMPLATE_VARIABLE_TOKEN[source]}}}`))
  }

  async function onSubmit(data: FormValues) {
    setFormError(null)
    const limitError = validateButtonLimits(data)
    if (limitError) {
      setFormError(limitError)
      return
    }
    const buttons: MessageTemplateButton[] = [
      ...data.quick_replies.map((qr) => ({ type: 'QUICK_REPLY' as const, text: qr.text })),
      ...data.action_buttons.map((b) =>
        b.type === 'URL'
          ? { type: 'URL' as const, text: b.text, url: b.url }
          : { type: 'PHONE_NUMBER' as const, text: b.text, phone_number: b.phone_number },
      ),
    ]
    try {
      await createTemplate.mutateAsync({ ...data, footer_text: data.footer_text || undefined, buttons })
      toast({ title: 'Template enviado pra aprovação da Meta', variant: 'success' })
      reset({
        language: 'pt_BR',
        category: 'UTILITY',
        name: '',
        body_text: '',
        footer_text: '',
        quick_replies: [],
        action_buttons: [],
      })
      onOpenChange(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo template de mensagem</DialogTitle>
          <DialogDescription>
            Vai ser submetido pra revisão da Meta - a aprovação costuma levar de minutos a um dia.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="template_name">Nome</Label>
            <Input id="template_name" placeholder="ex: reengajar_lead" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={category}
                onValueChange={(value) => setValue('category', value as MessageTemplateCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MESSAGE_TEMPLATE_CATEGORY_LABEL) as MessageTemplateCategory[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {MESSAGE_TEMPLATE_CATEGORY_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template_language">Idioma</Label>
              <Input id="template_language" {...register('language')} />
              {errors.language && <p className="text-xs text-destructive">{errors.language.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template_body">Corpo da mensagem</Label>
            <p className="text-xs text-muted-foreground">
              Uma parte da mensagem muda pra cada Lead? Clique pra inserir - o valor vem pronto sozinho na
              hora de iniciar a conversa, sem precisar digitar nada.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MESSAGE_TEMPLATE_VARIABLE_SOURCES.map((source) => (
                <Button
                  key={source}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={usedSources.has(source)}
                  onClick={() => insertVariable(source)}
                >
                  <Tag className="h-3.5 w-3.5" />
                  {MESSAGE_TEMPLATE_VARIABLE_SOURCE_LABEL[source]}
                </Button>
              ))}
            </div>
            <Textarea
              id="template_body"
              rows={4}
              placeholder="Ex: Olá, notamos que você não respondeu. Podemos ajudar?"
              {...bodyRegisterRest}
              ref={(el) => {
                bodyRegisterRef(el)
                bodyRef.current = el
              }}
            />
            {errors.body_text && <p className="text-xs text-destructive">{errors.body_text.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template_footer">Rodapé (opcional)</Label>
            <Input id="template_footer" maxLength={60} {...register('footer_text')} />
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div>
              <Label>Botões (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Até 10 no total. Templates de Marketing precisam de um botão de resposta rápida pra recusar receber
                mais mensagens (ex: "Parar promoções") - veja{' '}
                <Link to="/whatsapp/templates/ajuda" className="underline">
                  as regras da Meta
                </Link>
                .
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Respostas rápidas</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={totalButtonCount >= 10}
                  onClick={() => appendQuickReply({ text: '' })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>
              {quickReplyFields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input placeholder='Ex: "Sim, quero saber mais"' {...register(`quick_replies.${index}.text`)} />
                    {errors.quick_replies?.[index]?.text && (
                      <p className="text-xs text-destructive">{errors.quick_replies[index]?.text?.message}</p>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeQuickReply(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Botões de ação</span>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={totalButtonCount >= 10 || urlButtonCount >= 2}
                    onClick={() => appendActionButton({ type: 'URL', text: '', url: '' })}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={totalButtonCount >= 10 || phoneButtonCount >= 1}
                    onClick={() => appendActionButton({ type: 'PHONE_NUMBER', text: '', phone_number: '' })}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Telefone
                  </Button>
                </div>
              </div>
              {actionButtonFields.map((field, index) => {
                const type = watch(`action_buttons.${index}.type`)
                const url = watch(`action_buttons.${index}.url`) ?? ''
                return (
                  <div key={field.id} className="space-y-1.5 rounded-md border p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{MESSAGE_TEMPLATE_BUTTON_TYPE_LABEL[type]}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeActionButton(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Input placeholder="Texto do botão" {...register(`action_buttons.${index}.text`)} />
                      {errors.action_buttons?.[index]?.text && (
                        <p className="text-xs text-destructive">{errors.action_buttons[index]?.text?.message}</p>
                      )}
                    </div>
                    {type === 'URL' ? (
                      <>
                        <div>
                          <Input placeholder="https://..." {...register(`action_buttons.${index}.url`)} />
                          {errors.action_buttons?.[index]?.url && (
                            <p className="text-xs text-destructive">{errors.action_buttons[index]?.url?.message}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {MESSAGE_TEMPLATE_VARIABLE_SOURCES.map((source) => (
                            <Button
                              key={source}
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={hasAnyToken(url)}
                              onClick={() => insertUrlVariable(index, source)}
                            >
                              <Tag className="h-3 w-3" />
                              {MESSAGE_TEMPLATE_VARIABLE_SOURCE_LABEL[source]}
                            </Button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div>
                        <Input placeholder="+5511999998888" {...register(`action_buttons.${index}.phone_number`)} />
                        {errors.action_buttons?.[index]?.phone_number && (
                          <p className="text-xs text-destructive">
                            {errors.action_buttons[index]?.phone_number?.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar pra aprovação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
