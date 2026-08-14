import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/services/apiClient'
import { useLead, useLeads } from '@/hooks/useLeads'
import { useEmployees } from '@/hooks/useEmployees'
import {
  useAppointmentTypes,
  useAvailability,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
} from '@/hooks/useAppointments'
import { toDateParam, formatDateOnly, formatTimeOnly, formatDateTime } from '@/utils/appointmentFormat'
import { formatPhone } from '@/utils/phone'
import { APPOINTMENT_STATUS_LABEL } from '@/types/appointment'
import type { Appointment } from '@/types/appointment'

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fixa o lead (fluxo a partir da aba "Agendamentos" do Lead) - some o seletor. */
  leadId?: string
  /** Pré-seleciona funcionário/dia (fluxo a partir de um clique na grade da Agenda). */
  initialEmployeeId?: string
  initialDate?: Date
  /** Agendamento existente - modo reagendar/cancelar em vez de criar. */
  appointment?: Appointment
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  leadId,
  initialEmployeeId,
  initialDate,
  appointment,
}: AppointmentFormDialogProps) {
  const { toast } = useToast()
  const isEditing = !!appointment
  const [rescheduling, setRescheduling] = useState(!isEditing)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const [selectedLeadId, setSelectedLeadId] = useState(leadId ?? appointment?.lead_id ?? '')
  const [typeId, setTypeId] = useState(appointment?.appointment_type_id ?? '')
  const [employeeFilter, setEmployeeFilter] = useState(initialEmployeeId ?? appointment?.employee_id ?? '')
  const [date, setDate] = useState<Date>(initialDate ?? (appointment ? new Date(appointment.starts_at) : new Date()))
  const [selectedSlot, setSelectedSlot] = useState<{ starts_at: string; employee_id: string; employee_name: string } | null>(null)
  const [notes, setNotes] = useState(appointment?.notes ?? '')

  const { data: leads } = useLeads()
  const { data: fixedLead } = useLead(leadId)
  const { data: employees } = useEmployees()
  const { data: types } = useAppointmentTypes()
  const { data: slots, isLoading: loadingSlots } = useAvailability(
    rescheduling && typeId
      ? {
          appointment_type_id: typeId,
          from_date: toDateParam(date),
          to_date: toDateParam(date),
          employee_id: employeeFilter || undefined,
        }
      : undefined,
  )

  const createAppointment = useCreateAppointment()
  const updateAppointment = useUpdateAppointment()
  const cancelAppointment = useCancelAppointment()

  const activeEmployees = (employees ?? []).filter((e) => e.status === 'ACTIVE')
  const submitting = createAppointment.isPending || updateAppointment.isPending

  async function handleSubmit() {
    if (!selectedLeadId || !typeId || !selectedSlot) return
    try {
      if (isEditing && appointment) {
        await updateAppointment.mutateAsync({
          id: appointment.id,
          payload: {
            appointment_type_id: typeId,
            employee_id: selectedSlot.employee_id,
            starts_at: selectedSlot.starts_at,
            notes: notes || null,
          },
        })
        toast({ title: 'Agendamento remarcado', variant: 'success' })
      } else {
        await createAppointment.mutateAsync({
          lead_id: selectedLeadId,
          employee_id: selectedSlot.employee_id,
          appointment_type_id: typeId,
          starts_at: selectedSlot.starts_at,
          notes: notes || undefined,
        })
        toast({ title: 'Agendamento criado', variant: 'success' })
      }
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Não foi possível salvar o agendamento',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleCancel() {
    if (!appointment) return
    try {
      await cancelAppointment.mutateAsync({ id: appointment.id })
      toast({ title: 'Agendamento cancelado', variant: 'success' })
      setConfirmCancel(false)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Não foi possível cancelar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const leadLabel = leadId
    ? fixedLead
      ? `${fixedLead.full_name ?? 'Lead sem nome'} · ${formatPhone(fixedLead.phone)}`
      : '...'
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Agendamento' : 'Novo agendamento'}</DialogTitle>
          {isEditing && (
            <DialogDescription>
              {formatDateTime(appointment.starts_at)} · {APPOINTMENT_STATUS_LABEL[appointment.status]}
            </DialogDescription>
          )}
        </DialogHeader>

        {isEditing && !rescheduling ? (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <strong>{appointment.appointment_type_name}</strong> com {appointment.lead_full_name ?? appointment.lead_phone}
              </p>
              <p className="text-muted-foreground">Responsável: {appointment.employee_name}</p>
              {appointment.notes && <p className="text-muted-foreground">Obs: {appointment.notes}</p>}
            </div>
            {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setRescheduling(true)}>
                  Reagendar
                </Button>
                <Button type="button" variant="destructive" className="flex-1" onClick={() => setConfirmCancel(true)}>
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!leadId && (
              <div className="space-y-1.5">
                <Label>Lead</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId} disabled={isEditing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {(leads ?? []).map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.full_name ?? 'Lead sem nome'} · {formatPhone(lead.phone)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {leadLabel && <p className="text-sm text-muted-foreground">{leadLabel}</p>}

            <div className="space-y-1.5">
              <Label>Tipo de agendamento</Label>
              <Select
                value={typeId}
                onValueChange={(value) => {
                  setTypeId(value)
                  setSelectedSlot(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {(types ?? []).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.duration_minutes}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Profissional (opcional)</Label>
              <Select
                value={employeeFilter || '__any__'}
                onValueChange={(value) => {
                  setEmployeeFilter(value === '__any__' ? '' : value)
                  setSelectedSlot(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer um" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__">Qualquer um</SelectItem>
                  {activeEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Dia</Label>
              <Calendar
                value={date}
                onChange={(value) => {
                  setDate(value)
                  setSelectedSlot(null)
                }}
                minDate={new Date()}
                aria-label="Escolher dia do agendamento"
              />
            </div>

            {typeId && (
              <div className="space-y-1.5">
                <Label>Horários livres em {formatDateOnly(date)}</Label>
                {loadingSlots && <p className="text-sm text-muted-foreground">Buscando horários...</p>}
                {!loadingSlots && slots?.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum horário livre nesse dia - tente outro dia.</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {slots?.map((slot) => (
                    <button
                      key={`${slot.employee_id}-${slot.starts_at}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className="focus-visible:outline-none"
                    >
                      <Badge
                        variant={selectedSlot?.starts_at === slot.starts_at && selectedSlot?.employee_id === slot.employee_id ? 'default' : 'outline'}
                        className="cursor-pointer"
                      >
                        {formatTimeOnly(slot.starts_at)}
                        {!employeeFilter && ` · ${slot.employee_name}`}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="appointment_notes">Observações (opcional)</Label>
              <Textarea id="appointment_notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              {isEditing && (
                <Button type="button" variant="outline" onClick={() => setRescheduling(false)}>
                  Voltar
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedLeadId || !typeId || !selectedSlot || submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? 'Confirmar novo horário' : 'Agendar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {appointment && (
        <ConfirmDialog
          open={confirmCancel}
          onOpenChange={setConfirmCancel}
          title="Cancelar agendamento"
          description={`Cancelar o agendamento de ${appointment.appointment_type_name} com ${appointment.lead_full_name ?? appointment.lead_phone}?`}
          confirmLabel="Cancelar agendamento"
          variant="destructive"
          isPending={cancelAppointment.isPending}
          onConfirm={handleCancel}
        />
      )}
    </Dialog>
  )
}
