import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useUpdateMyProfile } from '@/hooks/useProfile'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import type { EmployeeMe } from '@/types/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChangePasswordForm } from '@/pages/profile/ChangePasswordDialog'
import { GoogleCalendarSettings } from '@/pages/profile/GoogleCalendarSettings'

interface ProfileSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeMe
}

/**
 * Tela única de conta, acessada por "Meu perfil" no dropdown do avatar -
 * substitui os 3 diálogos separados que existiam antes (Meu perfil /
 * Alterar senha / Google Calendar), cada um só descobrível clicando num
 * item de menu diferente. Mesmo padrão de Dialog+Tabs já usado em
 * `LeadDetailDialog.tsx`. O botão "Conectar Google Calendar" da Agenda
 * usa `GoogleCalendarDialog` (sem abas) em vez deste - ali o contexto é só
 * conectar a agenda, não editar o resto da conta.
 */
export function ProfileSettingsDialog({ open, onOpenChange, employee }: ProfileSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Meu perfil</DialogTitle>
          <DialogDescription>Gerencie seus dados, sua senha e suas integrações pessoais.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="personal">
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
            <GoogleCalendarSettings />
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
