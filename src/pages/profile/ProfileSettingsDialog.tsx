import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useUpdateMyProfile } from '@/hooks/useProfile'
import { useConnectGoogleCalendar, useDisconnectGoogleCalendar, useGoogleCalendarStatus } from '@/hooks/useGoogleCalendar'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import type { EmployeeMe } from '@/types/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ChangePasswordForm } from '@/pages/profile/ChangePasswordDialog'

export type ProfileSettingsTab = 'personal' | 'password' | 'google-calendar'

interface ProfileSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeMe
  /** Permite abrir direto numa aba específica (ex: link "Conectar Google Calendar" na Agenda). */
  defaultTab?: ProfileSettingsTab
}

/**
 * Tela única de conta - substitui os 3 diálogos separados que existiam antes
 * (Meu perfil / Alterar senha / Google Calendar), cada um só descobrível
 * clicando num item de menu diferente. Mesmo padrão de Dialog+Tabs já usado
 * em `LeadDetailDialog.tsx`.
 */
export function ProfileSettingsDialog({ open, onOpenChange, employee, defaultTab = 'personal' }: ProfileSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Meu perfil</DialogTitle>
          <DialogDescription>Gerencie seus dados, sua senha e suas integrações pessoais.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Dados pessoais</TabsTrigger>
            <TabsTrigger value="password">Senha</TabsTrigger>
            <TabsTrigger value="google-calendar">Google Calendar</TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <PersonalDataTab employee={employee} />
          </TabsContent>
          <TabsContent value="password">
            <ChangePasswordForm onSuccess={() => {}} />
          </TabsContent>
          <TabsContent value="google-calendar">
            <GoogleCalendarTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

const profileSchema = z.object({
  full_name: z.string().min(1, 'Informe o nome completo'),
  email: z.string().min(1, 'Informe o email').email('Email inválido'),
  phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function PersonalDataTab({ employee }: { employee: EmployeeMe }) {
  const updateProfile = useUpdateMyProfile()
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: employee.full_name, email: employee.email, phone: employee.phone ?? '' },
  })

  async function onSubmit(data: ProfileFormValues) {
    setFormError(null)
    try {
      await updateProfile.mutateAsync(data)
      toast({ title: 'Perfil atualizado', variant: 'success' })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors.full_name) setError('full_name', { message: error.fieldErrors.full_name })
        if (error.fieldErrors.email) setError('email', { message: error.fieldErrors.email })
        if (error.fieldErrors.phone) setError('phone', { message: error.fieldErrors.phone })
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message)
      } else {
        setFormError('Ocorreu um erro inesperado. Tente novamente.')
      }
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
        <Label htmlFor="profile_full_name">Nome completo</Label>
        <Input id="profile_full_name" {...register('full_name')} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile_email">Email</Label>
        <Input id="profile_email" type="email" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile_phone">Telefone</Label>
        <Input id="profile_phone" {...register('phone')} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}

function GoogleCalendarTab() {
  const { data: connection, isLoading } = useGoogleCalendarStatus()
  const connect = useConnectGoogleCalendar()
  const disconnect = useDisconnectGoogleCalendar()
  const { toast } = useToast()
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleConnect() {
    try {
      const { authorize_url } = await connect.mutateAsync()
      // Navegação de página inteira, não XHR - o próximo salto é o
      // consentimento do Google, não algo que a SPA consiga tratar em XHR.
      window.location.href = authorize_url
    } catch {
      toast({ title: 'Não foi possível iniciar a conexão com o Google Calendar', variant: 'destructive' })
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await disconnect.mutateAsync()
      toast({ title: 'Google Calendar desconectado', variant: 'success' })
    } catch {
      toast({ title: 'Não foi possível desconectar', variant: 'destructive' })
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Conecte sua conta do Google pra que seus agendamentos do Puka apareçam automaticamente na sua agenda pessoal.
        Só cria/atualiza/remove os eventos - nunca lê sua agenda de volta.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : connection ? (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="font-medium">
            Conectado{connection.google_account_email ? ` como ${connection.google_account_email}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            Desde{' '}
            {new Date(connection.connected_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma conta do Google conectada ainda.</p>
      )}

      <div className="flex justify-end">
        {connection ? (
          <Button type="button" variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting && <Loader2 className="h-4 w-4 animate-spin" />}
            Desconectar
          </Button>
        ) : (
          <Button type="button" onClick={handleConnect} disabled={connect.isPending}>
            {connect.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Conectar Google Calendar
          </Button>
        )}
      </div>
    </div>
  )
}
