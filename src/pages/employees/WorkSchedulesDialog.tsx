import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Trash2 } from 'lucide-react'
import { useCreateWorkSchedule, useDeleteWorkSchedule, useWorkSchedules } from '@/hooks/useWorkSchedules'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { WEEKDAY_LABELS, type Weekday } from '@/types/workSchedule'
import type { Employee } from '@/types/employee'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z
  .object({
    weekday: z.string().min(1),
    start_time: z.string().min(1, 'Informe o horário de início'),
    end_time: z.string().min(1, 'Informe o horário de término'),
  })
  .refine((data) => data.start_time < data.end_time, {
    message: 'O horário de início deve ser antes do término',
    path: ['end_time'],
  })

type FormValues = z.infer<typeof schema>

interface WorkSchedulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee
}

export function WorkSchedulesDialog({ open, onOpenChange, employee }: WorkSchedulesDialogProps) {
  const { data: schedules, isLoading } = useWorkSchedules(employee.id)
  const createSchedule = useCreateWorkSchedule(employee.id)
  const deleteSchedule = useDeleteWorkSchedule(employee.id)
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { weekday: '1' } })

  const selectedWeekday = watch('weekday')
  const hasOverlapWarning =
    !!selectedWeekday && (schedules ?? []).some((s) => String(s.weekday) === selectedWeekday)

  async function onSubmit(data: FormValues) {
    setFormError(null)
    try {
      await createSchedule.mutateAsync({
        weekday: Number(data.weekday) as Weekday,
        start_time: data.start_time,
        end_time: data.end_time,
      })
      reset({ weekday: data.weekday, start_time: '', end_time: '' })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSchedule.mutateAsync(id)
      toast({ title: 'Horário removido', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Não foi possível remover',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Horários de trabalho</DialogTitle>
          <DialogDescription>{employee.full_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : schedules && schedules.length > 0 ? (
            schedules
              .slice()
              .sort((a, b) => a.weekday - b.weekday)
              .map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>
                    <strong>{WEEKDAY_LABELS[schedule.weekday]}</strong> · {schedule.start_time} - {schedule.end_time}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(schedule.id)}
                    aria-label="Remover horário"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum horário cadastrado ainda.</p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border-t pt-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {hasOverlapWarning && (
            <Alert variant="warning">
              <AlertDescription>Já existe um horário cadastrado nesse dia — confira antes de salvar.</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="weekday">Dia</Label>
              <Controller
                control={control}
                name="weekday"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="weekday">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WEEKDAY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Início</Label>
              <Input id="start_time" type="time" {...register('start_time')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">Término</Label>
              <Input id="end_time" type="time" {...register('end_time')} />
            </div>
          </div>
          {(errors.start_time || errors.end_time) && (
            <p className="text-xs text-destructive">{errors.start_time?.message ?? errors.end_time?.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Adicionar horário
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
