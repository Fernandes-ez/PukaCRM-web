import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useUpdateLead } from '@/hooks/useLeads'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { LEAD_GENDER_LABEL, LEAD_STATUS_LABEL, type Lead, type LeadGender } from '@/types/lead'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

const schema = z.object({
  full_name: z.string().optional(),
  phone: z.string().min(1, 'Informe o telefone'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birth_date: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const statusOptions = (Object.entries(LEAD_STATUS_LABEL) as [FormValues['status'], string][]).map(
  ([value, label]) => ({ value, label }),
)

interface EditLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
}

export function EditLeadDialog({ open, onOpenChange, lead }: EditLeadDialogProps) {
  const updateLead = useUpdateLead()
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
      full_name: lead.full_name ?? '',
      phone: lead.phone,
      email: lead.email ?? '',
      status: lead.status,
      gender: lead.gender ?? undefined,
      birth_date: lead.birth_date ?? '',
    },
  })

  async function onSubmit(data: FormValues) {
    setFormError(null)
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        payload: {
          ...data,
          full_name: data.full_name || undefined,
          email: data.email || undefined,
          birth_date: data.birth_date || undefined,
        },
      })
      toast({ title: 'Lead atualizado', variant: 'success' })
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar lead</DialogTitle>
          <DialogDescription>Atualize os dados de {lead.full_name ?? 'lead sem nome'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="edit_lead_name">Nome (opcional)</Label>
            <Input id="edit_lead_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit_lead_phone">Telefone</Label>
            <Input id="edit_lead_phone" {...register('phone')} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit_lead_email">Email (opcional)</Label>
            <Input id="edit_lead_email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit_lead_status">Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="edit_lead_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit_lead_gender">Sexo (opcional)</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={(value) => field.onChange(value as LeadGender)}>
                    <SelectTrigger id="edit_lead_gender">
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
              <Label htmlFor="edit_lead_birth_date">Nascimento (opcional)</Label>
              <Input id="edit_lead_birth_date" type="date" {...register('birth_date')} />
            </div>
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
