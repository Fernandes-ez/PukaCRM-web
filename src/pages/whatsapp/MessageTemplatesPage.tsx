import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2, Tag, ArrowRight } from 'lucide-react'
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
  MESSAGE_TEMPLATE_CATEGORY_LABEL,
  MESSAGE_TEMPLATE_STATUS_LABEL,
  MESSAGE_TEMPLATE_VARIABLE_SOURCE_LABEL,
  MESSAGE_TEMPLATE_VARIABLE_TOKEN,
  type MessageTemplate,
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

const schema = z.object({
  name: z
    .string()
    .min(1, 'Informe o nome')
    .regex(/^[a-z0-9_]+$/, 'Só minúsculas, números e underscore (ex: promo_verao)'),
  language: z.string().min(2, 'Informe o idioma'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  body_text: z.string().min(1, 'Informe o corpo da mensagem'),
  footer_text: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

/** Toda variável é um campo fixo do CRM - sem opção "digitar na hora" de propósito. */
const VARIABLE_SOURCES: MessageTemplateVariableSource[] = ['LEAD_NAME', 'LEAD_PHONE', 'EMPLOYEE_NAME', 'COMPANY_NAME']

/** Quais fontes já aparecem no texto - espelha detect_variable_sources do backend. */
function detectVariableSources(bodyText: string): Set<MessageTemplateVariableSource> {
  const used = new Set<MessageTemplateVariableSource>()
  for (const source of VARIABLE_SOURCES) {
    if (bodyText.includes(`{{${MESSAGE_TEMPLATE_VARIABLE_TOKEN[source]}}}`)) used.add(source)
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
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { language: 'pt_BR', category: 'UTILITY' },
  })
  const { ref: bodyRegisterRef, ...bodyRegisterRest } = register('body_text')

  const category = watch('category')
  const bodyText = watch('body_text') ?? ''
  const usedSources = detectVariableSources(bodyText)

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

  async function onSubmit(data: FormValues) {
    setFormError(null)
    try {
      await createTemplate.mutateAsync({ ...data, footer_text: data.footer_text || undefined })
      toast({ title: 'Template enviado pra aprovação da Meta', variant: 'success' })
      reset({ language: 'pt_BR', category: 'UTILITY', name: '', body_text: '', footer_text: '' })
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
              {VARIABLE_SOURCES.map((source) => (
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
