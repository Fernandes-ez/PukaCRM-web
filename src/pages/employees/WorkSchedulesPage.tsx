import { useEmployees } from '@/hooks/useEmployees'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmployeeScheduleCard } from '@/pages/employees/EmployeeScheduleCard'

export function WorkSchedulesPage() {
  const { data: employees, isLoading } = useEmployees()
  const activeEmployees = (employees ?? []).filter((employee) => employee.status === 'ACTIVE')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Horários de trabalho</h1>
        <p className="text-sm text-muted-foreground">
          Expediente de cada funcionário — usado na distribuição automática de leads e para a Agenda nunca oferecer
          um horário fora do expediente.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : activeEmployees.length === 0 ? (
        <Alert>
          <AlertDescription>Nenhum funcionário ativo ainda — cadastre em Funcionários primeiro.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {activeEmployees.map((employee) => (
            <EmployeeScheduleCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}
    </div>
  )
}
