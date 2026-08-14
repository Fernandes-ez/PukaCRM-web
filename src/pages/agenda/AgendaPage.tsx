import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployees } from '@/hooks/useEmployees'
import { useAppointments } from '@/hooks/useAppointments'
import { WeekCalendar } from '@/components/agenda/WeekCalendar'
import { AppointmentFormDialog } from '@/pages/agenda/AppointmentFormDialog'
import { AppointmentTypesDialog } from '@/pages/agenda/AppointmentTypesDialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { addDays, startOfWeek, toDateParam } from '@/utils/appointmentFormat'
import type { Appointment } from '@/types/appointment'

type View = 'day' | 'week'

export function AgendaPage() {
  const { hasPermission } = useAuth()
  const [view, setView] = useState<View>('day')
  const [anchorDate, setAnchorDate] = useState(new Date())
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [formState, setFormState] = useState<{ employeeId?: string; date?: Date; appointment?: Appointment } | null>(null)
  const [showTypesDialog, setShowTypesDialog] = useState(false)

  const { data: employees, isLoading: loadingEmployees } = useEmployees()
  const activeEmployees = (employees ?? []).filter((e) => e.status === 'ACTIVE' && e.accepts_appointments)
  const visibleEmployees = employeeFilter ? activeEmployees.filter((e) => e.id === employeeFilter) : activeEmployees

  const range = useMemo(() => {
    if (view === 'day') {
      return { from: anchorDate, to: anchorDate }
    }
    const start = startOfWeek(anchorDate)
    return { from: start, to: addDays(start, 6) }
  }, [view, anchorDate])

  const { data: appointments, isLoading: loadingAppointments } = useAppointments({
    from_date: toDateParam(range.from),
    to_date: toDateParam(range.to),
    employee_id: employeeFilter || undefined,
  })

  const canCreate = hasPermission('SCHEDULING', 'appointment', 'CREATE')
  const canManageTypes = hasPermission('SCHEDULING', 'appointment_type', 'MANAGE')

  function navigate(delta: number) {
    setAnchorDate((prev) => addDays(prev, view === 'day' ? delta : delta * 7))
  }

  const rangeLabel =
    view === 'day'
      ? anchorDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
      : `${range.from.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${range.to.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize">{rangeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManageTypes && (
            <Button variant="outline" size="sm" onClick={() => setShowTypesDialog(true)}>
              <Settings className="h-3.5 w-3.5" />
              Tipos de agendamento
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={() => setFormState({})}>
              <Plus className="h-3.5 w-3.5" />
              Novo agendamento
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchorDate(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)} aria-label="Próximo">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={employeeFilter || '__all__'} onValueChange={(v) => setEmployeeFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os funcionários" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os funcionários</SelectItem>
              {activeEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div role="group" aria-label="Dia ou semana" className="inline-flex items-center gap-1 rounded-md border p-1">
            <Button variant={view === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setView('day')}>
              Dia
            </Button>
            <Button variant={view === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setView('week')}>
              Semana
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loadingEmployees || loadingAppointments ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <WeekCalendar
              view={view}
              anchorDate={anchorDate}
              employees={visibleEmployees.map((e) => ({ id: e.id, full_name: e.full_name }))}
              appointments={appointments ?? []}
              onSlotClick={(employeeId, date) => setFormState({ employeeId, date })}
              onAppointmentClick={(appointment) => setFormState({ appointment })}
            />
          )}
        </CardContent>
      </Card>

      {formState && (
        <AppointmentFormDialog
          open={!!formState}
          onOpenChange={(open) => !open && setFormState(null)}
          initialEmployeeId={formState.employeeId}
          initialDate={formState.date}
          appointment={formState.appointment}
        />
      )}

      {showTypesDialog && <AppointmentTypesDialog open={showTypesDialog} onOpenChange={setShowTypesDialog} />}
    </div>
  )
}
