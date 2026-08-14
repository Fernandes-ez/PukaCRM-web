import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLeadAppointments } from '@/hooks/useAppointments'
import { APPOINTMENT_STATUS_VARIANT, formatDateTime } from '@/utils/appointmentFormat'
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_SOURCE_LABEL } from '@/types/appointment'
import { AppointmentFormDialog } from '@/pages/agenda/AppointmentFormDialog'

export function LeadAppointmentsTab({ leadId }: { leadId: string }) {
  const { data: appointments, isLoading } = useLeadAppointments(leadId)
  const [showForm, setShowForm] = useState(false)

  const sorted = (appointments ?? []).slice().sort((a, b) => b.starts_at.localeCompare(a.starts_at))

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && sorted.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {sorted.map((appointment) => (
          <div key={appointment.id} className="rounded-md border p-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{appointment.appointment_type_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(appointment.starts_at)} · {appointment.employee_name}
                  {appointment.created_by === 'AI' && ` · via ${APPOINTMENT_SOURCE_LABEL.AI}`}
                </p>
              </div>
              <Badge variant={APPOINTMENT_STATUS_VARIANT[appointment.status]}>
                {APPOINTMENT_STATUS_LABEL[appointment.status]}
              </Badge>
            </div>
            {appointment.notes && <p className="mt-1 text-xs text-muted-foreground">{appointment.notes}</p>}
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
        <CalendarPlus className="h-3.5 w-3.5" />
        Novo agendamento
      </Button>

      {showForm && (
        <AppointmentFormDialog open={showForm} onOpenChange={setShowForm} leadId={leadId} />
      )}
    </div>
  )
}
