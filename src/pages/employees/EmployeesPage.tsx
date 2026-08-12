import { useState } from 'react'
import { MoreHorizontal, Plus, CalendarClock, Pencil, UserX, UserCheck, KeyRound } from 'lucide-react'
import { useEmployees, useDeactivateEmployee, useUpdateEmployee, useResetEmployeePassword } from '@/hooks/useEmployees'
import { useRoles } from '@/hooks/useRoles'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SecretRevealDialog } from '@/components/secret-reveal-dialog'
import { EMPLOYEE_STATUS_LABEL, type Employee, type EmployeeStatus } from '@/types/employee'
import { displayRoleName } from '@/utils/roleDisplay'
import { CreateEmployeeDialog } from '@/pages/employees/CreateEmployeeDialog'
import { EditEmployeeDialog } from '@/pages/employees/EditEmployeeDialog'
import { WorkSchedulesDialog } from '@/pages/employees/WorkSchedulesDialog'

const statusVariant: Record<EmployeeStatus, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  VACATION: 'warning',
  LEAVE: 'warning',
  INACTIVE: 'secondary',
  DISABLED: 'destructive',
}

export function EmployeesPage() {
  const { data: employees, isLoading } = useEmployees()
  const { data: roles } = useRoles()
  const deactivateEmployee = useDeactivateEmployee()
  const updateEmployee = useUpdateEmployee()
  const resetPassword = useResetEmployeePassword()
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [scheduleEmployee, setScheduleEmployee] = useState<Employee | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<Employee | null>(null)
  const [revealedPassword, setRevealedPassword] = useState<{ employeeName: string; password: string } | null>(null)

  const roleNameById = new Map((roles ?? []).map((role) => [role.id, role.name]))

  async function handleDeactivate() {
    if (!deactivateTarget) return
    try {
      await deactivateEmployee.mutateAsync(deactivateTarget.id)
      toast({ title: 'Funcionário desativado', variant: 'success' })
      setDeactivateTarget(null)
    } catch (error) {
      toast({
        title: 'Não foi possível desativar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleReactivate(employee: Employee) {
    try {
      await updateEmployee.mutateAsync({ id: employee.id, payload: { status: 'ACTIVE' } })
      toast({ title: 'Funcionário reativado', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Não foi possível reativar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleResetPassword() {
    if (!resetPasswordTarget) return
    try {
      const { temporary_password } = await resetPassword.mutateAsync(resetPasswordTarget.id)
      setRevealedPassword({ employeeName: resetPasswordTarget.full_name, password: temporary_password })
      setResetPasswordTarget(null)
    } catch (error) {
      toast({
        title: 'Não foi possível redefinir a senha',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Funcionários</h1>
          <p className="text-sm text-muted-foreground">Gerencie a equipe que atende seus clientes</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo funcionário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os funcionários</CardTitle>
          <CardDescription>{employees?.length ?? 0} no total</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.full_name}
                      {employee.is_owner && (
                        <Badge variant="secondary" className="ml-2">
                          Dono
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                    <TableCell>
                      {displayRoleName(employee.role_name ?? roleNameById.get(employee.role_id) ?? '—')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[employee.status]}>{EMPLOYEE_STATUS_LABEL[employee.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditEmployee(employee)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setScheduleEmployee(employee)}>
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Horários de trabalho
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetPasswordTarget(employee)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Redefinir senha
                          </DropdownMenuItem>
                          {employee.status === 'ACTIVE' && !employee.is_owner && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeactivateTarget(employee)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Desativar
                            </DropdownMenuItem>
                          )}
                          {employee.status !== 'ACTIVE' && (
                            <DropdownMenuItem onClick={() => handleReactivate(employee)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {employees?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhum funcionário cadastrado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateEmployeeDialog open={createOpen} onOpenChange={setCreateOpen} roles={roles ?? []} />
      {editEmployee && (
        <EditEmployeeDialog
          employee={editEmployee}
          roles={roles ?? []}
          open={!!editEmployee}
          onOpenChange={(open) => !open && setEditEmployee(null)}
        />
      )}
      {scheduleEmployee && (
        <WorkSchedulesDialog
          employee={scheduleEmployee}
          open={!!scheduleEmployee}
          onOpenChange={(open) => !open && setScheduleEmployee(null)}
        />
      )}
      {deactivateTarget && (
        <ConfirmDialog
          open={!!deactivateTarget}
          onOpenChange={(open) => !open && setDeactivateTarget(null)}
          title="Desativar funcionário"
          description={`Desativar ${deactivateTarget.full_name}? O acesso dele será bloqueado.`}
          confirmLabel="Desativar"
          variant="destructive"
          isPending={deactivateEmployee.isPending}
          onConfirm={handleDeactivate}
        />
      )}
      {resetPasswordTarget && (
        <ConfirmDialog
          open={!!resetPasswordTarget}
          onOpenChange={(open) => !open && setResetPasswordTarget(null)}
          title="Redefinir senha"
          description={`Gerar uma senha temporária nova pra ${resetPasswordTarget.full_name}? A senha atual dele deixa de funcionar e ele vai precisar trocar no próximo login.`}
          confirmLabel="Redefinir senha"
          isPending={resetPassword.isPending}
          onConfirm={handleResetPassword}
        />
      )}
      {revealedPassword && (
        <SecretRevealDialog
          open={!!revealedPassword}
          onOpenChange={(open) => !open && setRevealedPassword(null)}
          title={`Nova senha de ${revealedPassword.employeeName}`}
          label="a senha temporária"
          secret={revealedPassword.password}
        />
      )}
    </div>
  )
}
