import { Plus } from 'lucide-react'
import { AppointmentBlock } from '@/components/agenda/AppointmentBlock'
import { cn } from '@/utils/cn'
import { addDays, formatTimeOnly, startOfWeek } from '@/utils/appointmentFormat'
import type { Appointment } from '@/types/appointment'

const DAY_START_HOUR = 7
const DAY_END_HOUR = 21
const HOUR_HEIGHT_PX = 56
const TOTAL_HEIGHT_PX = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT_PX

const WEEKDAY_LABEL_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function minutesSinceDayStart(date: Date): number {
  return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes()
}

interface Employee {
  id: string
  full_name: string
}

interface WeekCalendarProps {
  view: 'day' | 'week'
  anchorDate: Date
  employees: Employee[]
  appointments: Appointment[]
  onSlotClick: (employeeId: string | undefined, date: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
}

export function WeekCalendar({ view, anchorDate, employees, appointments, onSlotClick, onAppointmentClick }: WeekCalendarProps) {
  if (view === 'week') {
    const start = startOfWeek(anchorDate)
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayAppointments = appointments
            .filter((a) => isSameDay(new Date(a.starts_at), day) && a.status !== 'CANCELED')
            .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
          return (
            <div key={day.toISOString()} className="min-h-[240px] rounded-md border">
              <div className="flex items-center justify-between border-b bg-muted/40 px-2 py-1.5">
                <p className="text-xs font-semibold">
                  {WEEKDAY_LABEL_SHORT[day.getDay()]} {day.getDate()}
                </p>
                <button
                  type="button"
                  onClick={() => onSlotClick(undefined, day)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Novo agendamento nesse dia"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1 p-1.5">
                {dayAppointments.length === 0 && <p className="px-1 text-[11px] text-muted-foreground">—</p>}
                {dayAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() => onAppointmentClick(appointment)}
                    className="block w-full truncate rounded-md border border-brand-300 bg-brand-50 px-1.5 py-1 text-left text-[11px] text-brand-900 hover:opacity-90 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-100"
                  >
                    <strong>{formatTimeOnly(appointment.starts_at)}</strong> {appointment.lead_full_name ?? appointment.lead_phone}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // view === 'day'
  if (employees.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Nenhum funcionário com horário de trabalho cadastrado — configure em Funcionários &gt; Horários de trabalho
        para a agenda mostrar disponibilidade.
      </div>
    )
  }

  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i)

  return (
    <div className="overflow-x-auto rounded-md border">
      <div className="flex min-w-[640px]">
        <div className="w-14 shrink-0 border-r">
          <div className="h-8 border-b" />
          {hours.map((hour) => (
            <div key={hour} style={{ height: HOUR_HEIGHT_PX }} className="border-b px-1 text-right text-[10px] text-muted-foreground">
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {employees.map((employee) => (
          <div key={employee.id} className="min-w-[180px] flex-1 border-r last:border-r-0">
            <div className="flex h-8 items-center justify-center border-b bg-muted/40 px-2">
              <p className="truncate text-xs font-medium">{employee.full_name}</p>
            </div>
            <div
              className="relative cursor-pointer"
              style={{ height: TOTAL_HEIGHT_PX }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const offsetY = e.clientY - rect.top
                const totalMinutes = (offsetY / TOTAL_HEIGHT_PX) * (DAY_END_HOUR - DAY_START_HOUR) * 60
                const roundedMinutes = Math.round(totalMinutes / 30) * 30
                const clicked = new Date(anchorDate)
                clicked.setHours(DAY_START_HOUR, 0, 0, 0)
                clicked.setMinutes(roundedMinutes)
                onSlotClick(employee.id, clicked)
              }}
            >
              {hours.map((hour, i) => (
                <div key={hour} className={cn('absolute left-0 right-0 border-b border-dashed border-border/60', i === 0 && 'border-t')} style={{ top: i * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }} />
              ))}
              {appointments
                .filter((a) => a.employee_id === employee.id && isSameDay(new Date(a.starts_at), anchorDate))
                .map((appointment) => {
                  const start = new Date(appointment.starts_at)
                  const end = new Date(appointment.ends_at)
                  const top = Math.max(0, (minutesSinceDayStart(start) / 60) * HOUR_HEIGHT_PX)
                  const height = Math.max(20, ((end.getTime() - start.getTime()) / 60000 / 60) * HOUR_HEIGHT_PX)
                  return (
                    <AppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      style={{ top, height }}
                      onClick={() => onAppointmentClick(appointment)}
                    />
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
