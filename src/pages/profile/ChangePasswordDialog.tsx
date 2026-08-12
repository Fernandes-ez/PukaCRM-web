import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, KeyRound } from 'lucide-react'
import { useChangeMyPassword } from '@/hooks/useProfile'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Quando true, não pode ser fechado sem trocar a senha (primeiro acesso com senha temporária). */
  mandatory?: boolean
}

export function ChangePasswordDialog({ open, onOpenChange, mandatory = false }: ChangePasswordDialogProps) {
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

  function handleOpenChange(next: boolean) {
    if (mandatory && !next) return
    if (!next) reset()
    onOpenChange(next)
  }

  async function onSubmit(data: FormValues) {
    setFormError(null)
    try {
      await changePassword.mutateAsync({ current_password: data.current_password, new_password: data.new_password })
      toast({ title: 'Senha alterada com sucesso', variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message || 'Senha atual incorreta.')
      } else {
        setFormError('Ocorreu um erro inesperado. Tente novamente.')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose={mandatory}
        onInteractOutside={(e) => mandatory && e.preventDefault()}
        onEscapeKeyDown={(e) => mandatory && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {mandatory ? 'Defina sua nova senha' : 'Alterar senha'}
          </DialogTitle>
          <DialogDescription>
            {mandatory
              ? 'Você está usando uma senha temporária. Antes de continuar, defina uma senha nova.'
              : 'Informe sua senha atual e a nova senha desejada.'}
          </DialogDescription>
        </DialogHeader>
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
          <DialogFooter>
            {!mandatory && (
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mandatory ? 'Definir senha' : 'Salvar nova senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
