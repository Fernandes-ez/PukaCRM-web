import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useUpdateRole } from '@/hooks/useRoles'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import type { Role } from '@/types/role'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

const schema = z.object({
  name: z.string().min(1, 'Informe o nome do cargo'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface EditRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}

export function EditRoleDialog({ open, onOpenChange, role }: EditRoleDialogProps) {
  const updateRole = useUpdateRole()
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: role.name, description: role.description ?? '' },
  })

  async function onSubmit(data: FormValues) {
    setFormError(null)
    try {
      await updateRole.mutateAsync({ id: role.id, payload: data })
      toast({ title: 'Cargo atualizado', variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors.name) setError('name', { message: error.fieldErrors.name })
        else setFormError(error.message)
      } else {
        setFormError('Ocorreu um erro inesperado. Tente novamente.')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cargo</DialogTitle>
          <DialogDescription>Atualize os dados de {role.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="edit_role_name">Nome</Label>
            <Input id="edit_role_name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit_role_description">Descrição (opcional)</Label>
            <Textarea id="edit_role_description" {...register('description')} />
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
