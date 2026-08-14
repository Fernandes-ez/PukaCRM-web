import { useState } from 'react'
import { CalendarClock, TriangleAlert } from 'lucide-react'
import { useWorkSchedules } from '@/hooks/useWorkSchedules'
import { WEEKDAY_SHORT_LABELS, type Weekday } from '@/types/workSchedule'
import type { Employee } from '@/types/employee'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import { displayRoleName } from '@/utils/roleDisplay'
import { WorkSchedulesDialog } from '@/pages/employees/WorkSchedulesDialog'

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]

interface EmployeeScheduleCardProps {
  employee: Employee
}

export function EmployeeScheduleCard({ employee }: EmployeeScheduleCardProps) {
  const { data: schedules, isLoading } = useWorkSchedules(employee.id)
  const [dialogOpen, setDialogOpen] = useState(false)

  const scheduledDays = new Set((schedules ?? []).map((s) => s.day_of_week))
  const hasNoSchedule = !isLoading && (schedules?.length ?? 0) === 0

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{employee.full_name}</span>
            <span className="text-sm text-muted-foreground">{displayRoleName(employee.role_name ?? '—')}</span>
            {employee.accepts_appointments && (
              <Badge variant="secondary" className="gap-1">
                <CalendarClock className="h-3 w-3" />
                Recebe agendamentos
              </Badge>
            )}
            {hasNoSchedule && (
              <Badge variant="warning" className="gap-1">
                <TriangleAlert className="h-3 w-3" />
                Sem horário cadastrado
              </Badge>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-6 w-64" />
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {WEEKDAYS.map((day) => {
                const daySchedules = (schedules ?? []).filter((s) => s.day_of_week === day)
                const active = scheduledDays.has(day)
                return (
                  <div
                    key={day}
                    title={active ? daySchedules.map((s) => `${s.start_time}–${s.end_time}`).join(', ') : 'Sem expediente'}
                    className={cn(
                      'flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-medium',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground/60',
                    )}
                  >
                    {WEEKDAY_SHORT_LABELS[day]}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setDialogOpen(true)}>
          Editar horários
        </Button>
      </CardContent>

      <WorkSchedulesDialog employee={employee} open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  )
}
