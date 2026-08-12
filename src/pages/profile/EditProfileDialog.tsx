import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useUpdateMyProfile } from '@/hooks/useProfile'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import type { EmployeeMe } from '@/types/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const schema = z.object({
  full_name: z.string().min(1, 'Informe o nome completo'),
  email: z.string().min(1, 'Informe o email').email('Email inválido'),
  phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeMe
}

export function EditProfileDialog({ open, onOpenChange, employee }: EditProfileDialogProps) {
  const updateProfile = useUpdateMyProfile()
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone ?? '',
    },
  })

  async function onSubmit(data: FormValues) {
    setFormError(null)
    try {
      await updateProfile.mutateAsync(data)
      toast({ title: 'Perfil atualizado', variant: 'success' })
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meu perfil</DialogTitle>
          <DialogDescription>Atualize suas informações cadastrais</DialogDescription>
        </DialogHeader>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
