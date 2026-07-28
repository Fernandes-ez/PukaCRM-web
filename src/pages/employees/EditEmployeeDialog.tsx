import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useUpdateEmployee } from '@/hooks/useEmployees'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import type { Employee } from '@/types/employee'
import type { Role } from '@/types/role'
import { displayRoleName } from '@/utils/roleDisplay'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

const schema = z.object({
  full_name: z.string().min(1, 'Informe o nome completo'),
  email: z.string().min(1, 'Informe o email').email('Email inválido'),
  role_id: z.string().min(1, 'Selecione um cargo'),
})

type FormValues = z.infer<typeof schema>

interface EditEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee
  roles: Role[]
}

export function EditEmployeeDialog({ open, onOpenChange, employee, roles }: EditEmployeeDialogProps) {
  const updateEmployee = useUpdateEmployee()
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: employee.full_name,
      email: employee.email,
      role_id: employee.role_id,
    },
  })

  async function onSubmit(data: FormValues) {
    setFormError(null)
    try {
      await updateEmployee.mutateAsync({ id: employee.id, payload: data })
      toast({ title: 'Funcionário atualizado', variant: 'success' })
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar funcionário</DialogTitle>
          <DialogDescription>Atualize os dados de {employee.full_name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="edit_full_name">Nome completo</Label>
            <Input id="edit_full_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit_email">Email</Label>
            <Input id="edit_email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit_role_id">Cargo</Label>
            <Controller
              control={control}
              name="role_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={employee.is_owner}>
                  <SelectTrigger id="edit_role_id">
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
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
