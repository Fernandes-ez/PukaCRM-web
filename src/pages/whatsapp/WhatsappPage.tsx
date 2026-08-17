import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Loader2, Info, KeyRound, Unplug, ArrowRight } from 'lucide-react'
import {
  useWhatsappInstance,
  useCreateWhatsappInstance,
  useUpdateWhatsappInstance,
  useDisconnectWhatsappInstance,
  useRegenerateApiKey,
} from '@/hooks/useWhatsappInstance'
import { useAuth } from '@/contexts/AuthContext'
import { useBillingGate } from '@/hooks/useBillingGate'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { SecretRevealDialog } from '@/components/secret-reveal-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { WhatsAppInstanceStatus } from '@/types/whatsappInstance'

const createSchema = z.object({
  phone_number: z.string().min(8, 'Informe o número com DDI e DDD'),
  phone_number_id: z.string().min(1, 'Informe o Phone Number ID (vem do painel da Meta)'),
  waba_id: z.string().optional(),
  access_token: z.string().min(1, 'Informe o token de acesso (vem do painel da Meta)'),
  label: z.string().optional(),
})
type CreateFormValues = z.infer<typeof createSchema>

const updateSchema = z.object({
  phone_number: z.string().min(8, 'Informe o número com DDI e DDD'),
  phone_number_id: z.string().min(1, 'Informe o Phone Number ID (vem do painel da Meta)'),
  waba_id: z.string().optional(),
  access_token: z.string().optional(),
  label: z.string().optional(),
})
type UpdateFormValues = z.infer<typeof updateSchema>

const statusLabel: Record<WhatsAppInstanceStatus, string> = {
  PENDING: 'Pendente',
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
  ERROR: 'Erro',
}

const statusVariant: Record<WhatsAppInstanceStatus, 'warning' | 'success' | 'secondary' | 'destructive'> = {
  PENDING: 'warning',
  CONNECTED: 'success',
  DISCONNECTED: 'secondary',
  ERROR: 'destructive',
}

export function WhatsappPage() {
  const { data: instance, isLoading, isError, error } = useWhatsappInstance()
  const createInstance = useCreateWhatsappInstance()
  const updateInstance = useUpdateWhatsappInstance()
  const disconnectInstance = useDisconnectWhatsappInstance()
  const regenerateApiKey = useRegenerateApiKey()
  const { hasPermission } = useAuth()
  const { toast } = useToast()

  const [revealSecret, setRevealSecret] = useState<{ title: string; secret: string } | null>(null)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const notFound = isError && error instanceof ApiError && error.status === 404

  async function handleRegenerateApiKey() {
    try {
      const result = await regenerateApiKey.mutateAsync()
      setConfirmRegenerate(false)
      setRevealSecret({ title: 'Nova chave gerada', secret: result.service_api_key })
    } catch (err) {
      toast({
        title: 'Não foi possível gerar a chave',
        description: err instanceof ApiError ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectInstance.mutateAsync()
      toast({ title: 'Instância desconectada', variant: 'success' })
      setConfirmDisconnect(false)
    } catch (err) {
      toast({
        title: 'Não foi possível desconectar',
        description: err instanceof ApiError ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">Gerencie a instância que conecta sua empresa ao WhatsApp</p>
      </div>

      <Alert>
        <Info />
        <AlertTitle>Conexão manual (fase piloto)</AlertTitle>
        <AlertDescription>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Nossa equipe cadastra o número na Meta e te passa os valores pra colar abaixo.</span>
            <Link
              to="/whatsapp/ajuda"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver passo a passo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : notFound ? (
        <CreateInstanceCard
          onCreated={(secret) => setRevealSecret({ title: 'Instância criada', secret })}
          createInstance={createInstance}
        />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertDescription>{error instanceof ApiError ? error.message : 'Erro ao carregar.'}</AlertDescription>
        </Alert>
      ) : (
        instance && (
          <>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Status da conexão</CardTitle>
                  <CardDescription>Provedor: Meta Cloud API</CardDescription>
                </div>
                <Badge variant={statusVariant[instance.status]}>{statusLabel[instance.status]}</Badge>
              </CardHeader>
              <CardContent>
                <UpdateInstanceForm instance={instance} updateInstance={updateInstance} toast={toast} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chave de API de serviço</CardTitle>
                <CardDescription>Usada pelo canal máquina-a-máquina (n8n) — não é exibida novamente</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmRegenerate(true)}
                  disabled={regenerateApiKey.isPending}
                >
                  {regenerateApiKey.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Gerar nova chave
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmDisconnect(true)}
                  disabled={disconnectInstance.isPending}
                >
                  {disconnectInstance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                  Desconectar
                </Button>
              </CardContent>
            </Card>

            {hasPermission('WHATSAPP', 'message_template', 'VIEW') && (
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Templates de Mensagem</CardTitle>
                    <CardDescription>Iniciar conversa com um Lead fora da janela de atendimento de 24h</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link to="/whatsapp/templates">
                      Gerenciar
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardHeader>
              </Card>
            )}
          </>
        )
      )}

      {revealSecret && (
        <SecretRevealDialog
          open={!!revealSecret}
          onOpenChange={(open) => !open && setRevealSecret(null)}
          title={revealSecret.title}
          label="a chave de API"
          secret={revealSecret.secret}
        />
      )}
      <ConfirmDialog
        open={confirmRegenerate}
        onOpenChange={setConfirmRegenerate}
        title="Gerar nova chave de API"
        description="A chave atual deixará de funcionar imediatamente."
        confirmLabel="Gerar nova chave"
        isPending={regenerateApiKey.isPending}
        onConfirm={handleRegenerateApiKey}
      />
      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Desconectar WhatsApp"
        description="A empresa deixará de receber mensagens até reconectar."
        confirmLabel="Desconectar"
        variant="destructive"
        isPending={disconnectInstance.isPending}
        onConfirm={handleDisconnect}
      />
    </div>
  )
}

function CreateInstanceCard({
  onCreated,
  createInstance,
}: {
  onCreated: (secret: string) => void
  createInstance: ReturnType<typeof useCreateWhatsappInstance>
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const { blocked: billingBlocked, reason: billingBlockedReason } = useBillingGate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) })

  async function onSubmit(data: CreateFormValues) {
    setFormError(null)
    try {
      const result = await createInstance.mutateAsync({
        provider: 'META_CLOUD_API',
        phone_number: data.phone_number,
        phone_number_id: data.phone_number_id,
        waba_id: data.waba_id || undefined,
        label: data.label || undefined,
        credentials: { access_token: data.access_token },
      })
      onCreated(result.service_api_key)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Criar instância do WhatsApp</CardTitle>
        <CardDescription>Sua empresa ainda não tem uma instância configurada</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="phone_number">Número de telefone</Label>
            <Input id="phone_number" placeholder="+55 11 90000-0000" {...register('phone_number')} />
            {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone_number_id">Phone Number ID</Label>
            <Input id="phone_number_id" placeholder="Fornecido pela nossa equipe" {...register('phone_number_id')} />
            {errors.phone_number_id && <p className="text-xs text-destructive">{errors.phone_number_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="waba_id">WABA ID (opcional)</Label>
            <Input id="waba_id" placeholder="Necessário só pra criar Templates de mensagem" {...register('waba_id')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="access_token">Token de acesso</Label>
            <Input id="access_token" type="password" placeholder="Fornecido pela nossa equipe" {...register('access_token')} />
            {errors.access_token && <p className="text-xs text-destructive">{errors.access_token.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="label">Nome de identificação (opcional)</Label>
            <Input id="label" placeholder="Ex: WhatsApp Principal" {...register('label')} />
          </div>
          {billingBlocked && (
            <Alert variant="destructive">
              <AlertDescription>{billingBlockedReason}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={isSubmitting || billingBlocked}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar instância
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function UpdateInstanceForm({
  instance,
  updateInstance,
  toast,
}: {
  instance: NonNullable<ReturnType<typeof useWhatsappInstance>['data']>
  updateInstance: ReturnType<typeof useUpdateWhatsappInstance>
  toast: ReturnType<typeof useToast>['toast']
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const { blocked: billingBlocked, reason: billingBlockedReason } = useBillingGate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    values: {
      phone_number: instance.phone_number,
      phone_number_id: instance.phone_number_id ?? '',
      waba_id: instance.waba_id ?? '',
      access_token: '',
      label: instance.label ?? '',
    },
  })

  const isDisconnected = instance.status === 'DISCONNECTED'

  async function onSubmit(data: UpdateFormValues) {
    setFormError(null)
    try {
      await updateInstance.mutateAsync({
        phone_number: data.phone_number,
        phone_number_id: data.phone_number_id,
        waba_id: data.waba_id || undefined,
        label: data.label || undefined,
        ...(data.access_token ? { credentials: { access_token: data.access_token } } : {}),
        // PATCH não muda status sozinho (backend só atualiza se vier explícito) -
        // sem isso, depois de "Desconectar" não existia nenhum jeito de reativar pela tela.
        ...(isDisconnected ? { status: 'PENDING' as const } : {}),
      })
      toast({ title: isDisconnected ? 'Instância reconectada' : 'Instância atualizada', variant: 'success' })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="edit_phone_number">Número de telefone</Label>
        <Input id="edit_phone_number" placeholder="+55 11 90000-0000" {...register('phone_number')} />
        {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit_phone_number_id">Phone Number ID</Label>
        <Input id="edit_phone_number_id" {...register('phone_number_id')} />
        {errors.phone_number_id && <p className="text-xs text-destructive">{errors.phone_number_id.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit_waba_id">WABA ID (opcional)</Label>
        <Input id="edit_waba_id" placeholder="Necessário só pra criar Templates de mensagem" {...register('waba_id')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit_access_token">Token de acesso</Label>
        <Input id="edit_access_token" type="password" placeholder="Deixe em branco pra manter o atual" {...register('access_token')} />
        <p className="text-xs text-muted-foreground">Por segurança, o token salvo nunca é exibido de volta.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit_label">Nome de identificação (opcional)</Label>
        <Input id="edit_label" placeholder="Ex: WhatsApp Principal" {...register('label')} />
      </div>
      {billingBlocked && (
        <Alert variant="destructive">
          <AlertDescription>{billingBlockedReason}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={isSubmitting || billingBlocked}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isDisconnected ? 'Salvar e reconectar' : 'Salvar alterações'}
      </Button>
    </form>
  )
}
