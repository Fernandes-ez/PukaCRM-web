import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useChangeMyPassword } from '@/hooks/useProfile'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const schema = z
  .object({
    current_password: z.string().min(1, 'Informe a senha atual'),
    new_password: z.string().min(8, 'A nova senha precisa ter pelo menos 8 caracteres'),
    confirm_password: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'As senhas não conferem',
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof schema>

interface ChangePasswordFormProps {
  onSuccess: () => void
}

/** Extraído pra ser reaproveitado tanto no popup obrigatório do primeiro acesso (`ChangePasswordDialog`) quanto na aba "Senha" de `ProfileSettingsDialog`. */
export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const changePassword = useChangeMyPassword()
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  async function onSubmit(data: FormValues) {
    setFormError(null)
    try {
      await changePassword.mutateAsync({ current_password: data.current_password, new_password: data.new_password })
      toast({ title: 'Senha alterada com sucesso', variant: 'success' })
      reset()
      onSuccess()
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message || 'Senha atual incorreta.')
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
        <Label htmlFor="current_password">Senha atual</Label>
        <Input id="current_password" type="password" autoComplete="current-password" {...register('current_password')} />
        {errors.current_password && <p className="text-xs text-destructive">{errors.current_password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new_password">Nova senha</Label>
        <Input id="new_password" type="password" autoComplete="new-password" {...register('new_password')} />
        {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirmar nova senha</Label>
        <Input id="confirm_password" type="password" autoComplete="new-password" {...register('confirm_password')} />
        {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar nova senha
        </Button>
      </div>
    </form>
  )
}

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Popup obrigatório do primeiro acesso (senha temporária) - não pode ser fechado sem
 * trocar a senha. Troca voluntária virou a aba "Senha" de `ProfileSettingsDialog`.
 */
export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideClose onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Defina sua nova senha</DialogTitle>
          <DialogDescription>
            Você está usando uma senha temporária. Antes de continuar, defina uma senha nova.
          </DialogDescription>
        </DialogHeader>
        <ChangePasswordForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
