import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useCreateEmployee } from '@/hooks/useEmployees'
import { ApiError } from '@/services/apiClient'
import type { Role } from '@/types/role'
import { displayRoleName } from '@/utils/roleDisplay'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SecretRevealDialog } from '@/components/secret-reveal-dialog'

const schema = z.object({
  full_name: z.string().min(1, 'Informe o nome completo'),
  email: z.string().min(1, 'Informe o email').email('Email inválido'),
  role_id: z.string().min(1, 'Selecione um cargo'),
})

type FormValues = z.infer<typeof schema>

interface CreateEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: Role[]
}

export function CreateEmployeeDialog({ open, onOpenChange, roles }: CreateEmployeeDialogProps) {
  const createEmployee = useCreateEmployee()
  const [formError, setFormError] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormValues) {
    setFormError(null)
    try {
      const result = await createEmployee.mutateAsync(data)
      reset()
      onOpenChange(false)
      setTemporaryPassword(result.temporary_password)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors.full_name) setError('full_name', { message: error.fieldErrors.full_name })
        if (error.fieldErrors.email) setError('email', { message: error.fieldErrors.email })
        if (error.fieldErrors.role_id) setError('role_id', { message: error.fieldErrors.role_id })
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message)
      } else {
        setFormError('Ocorreu um erro inesperado. Tente novamente.')
      }
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset()
          onOpenChange(next)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo funcionário</DialogTitle>
            <DialogDescription>Uma senha temporária será gerada automaticamente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role_id">Cargo</Label>
              <Controller
                control={control}
                name="role_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="role_id">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {displayRoleName(role.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role_id && <p className="text-xs text-destructive">{errors.role_id.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar funcionário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {temporaryPassword && (
        <SecretRevealDialog
          open={!!temporaryPassword}
          onOpenChange={(open) => !open && setTemporaryPassword(null)}
          title="Funcionário criado"
          label="a senha temporária"
          secret={temporaryPassword}
        />
      )}
    </>
  )
}
