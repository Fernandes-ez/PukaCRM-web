import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useCreateLead } from '@/hooks/useLeads'
import { ApiError } from '@/services/apiClient'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LEAD_GENDER_LABEL, type LeadGender } from '@/types/lead'

const schema = z.object({
  full_name: z.string().optional(),
  phone: z.string().min(1, 'Informe o telefone'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birth_date: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface CreateLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLeadDialog({ open, onOpenChange }: CreateLeadDialogProps) {
  const createLead = useCreateLead()
  const [formError, setFormError] = useState<string | null>(null)

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
      await createLead.mutateAsync({
        ...data,
        full_name: data.full_name || undefined,
        email: data.email || undefined,
        birth_date: data.birth_date || undefined,
      })
      reset()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors.full_name) setError('full_name', { message: error.fieldErrors.full_name })
        if (error.fieldErrors.phone) setError('phone', { message: error.fieldErrors.phone })
        if (error.fieldErrors.email) setError('email', { message: error.fieldErrors.email })
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message)
      } else {
        setFormError('Ocorreu um erro inesperado. Tente novamente.')
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
          <DialogDescription>Cadastre um contato manualmente</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="lead_name">Nome (opcional)</Label>
            <Input id="lead_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead_phone">Telefone</Label>
            <Input id="lead_phone" placeholder="+55 11 90000-0000" {...register('phone')} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead_email">Email (opcional)</Label>
            <Input id="lead_email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead_gender">Sexo (opcional)</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={(value) => field.onChange(value as LeadGender)}>
                    <SelectTrigger id="lead_gender">
                      <SelectValue placeholder="Não informado" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LEAD_GENDER_LABEL) as LeadGender[]).map((value) => (
                        <SelectItem key={value} value={value}>
                          {LEAD_GENDER_LABEL[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead_birth_date">Nascimento (opcional)</Label>
              <Input id="lead_birth_date" type="date" {...register('birth_date')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
