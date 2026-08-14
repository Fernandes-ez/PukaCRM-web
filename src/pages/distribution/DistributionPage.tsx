import { useEffect, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { useEmployees, useUpdateEmployee } from '@/hooks/useEmployees'
import { useCompany, useUpdateCompany } from '@/hooks/useCompany'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EMPLOYEE_STATUS_LABEL, type Employee, type EmployeeStatus } from '@/types/employee'
import { displayRoleName } from '@/utils/roleDisplay'

const statusVariant: Record<EmployeeStatus, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  VACATION: 'warning',
  LEAVE: 'warning',
  INACTIVE: 'secondary',
  DISABLED: 'destructive',
}

function EmployeeDistributionRow({ employee }: { employee: Employee }) {
  const updateEmployee = useUpdateEmployee()
  const { toast } = useToast()
  const [priority, setPriority] = useState(String(employee.distribution_priority))
  const [maxActiveLeads, setMaxActiveLeads] = useState(String(employee.max_active_leads))

  useEffect(() => setPriority(String(employee.distribution_priority)), [employee.distribution_priority])
  useEffect(() => setMaxActiveLeads(String(employee.max_active_leads)), [employee.max_active_leads])

  // receive_leads e distribution_enabled sempre precisam estar juntos pra
  // valer alguma coisa (EmployeeRepository.list_eligible_for_distribution
  // exige os dois True) - mostrado aqui como um único interruptor.
  const participates = employee.receive_leads && employee.distribution_enabled

  async function handleToggle(checked: boolean) {
    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        payload: { receive_leads: checked, distribution_enabled: checked },
      })
    } catch (error) {
      toast({
        title: 'Não foi possível atualizar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleSavePriority() {
    const value = Number(priority)
    if (!Number.isInteger(value) || value === employee.distribution_priority) return
    try {
      await updateEmployee.mutateAsync({ id: employee.id, payload: { distribution_priority: value } })
    } catch (error) {
      setPriority(String(employee.distribution_priority))
      toast({
        title: 'Não foi possível atualizar a prioridade',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleSaveMaxActiveLeads() {
    const value = Number(maxActiveLeads)
    if (!Number.isInteger(value) || value < 0 || value === employee.max_active_leads) return
    try {
      await updateEmployee.mutateAsync({ id: employee.id, payload: { max_active_leads: value } })
    } catch (error) {
      setMaxActiveLeads(String(employee.max_active_leads))
      toast({
        title: 'Não foi possível atualizar o limite',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {employee.full_name}
        {employee.is_owner && (
          <Badge variant="secondary" className="ml-2">
            Dono
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{displayRoleName(employee.role_name ?? '—')}</TableCell>
      <TableCell>
        <Badge variant={statusVariant[employee.status]}>{EMPLOYEE_STATUS_LABEL[employee.status]}</Badge>
      </TableCell>
      <TableCell>
        <Switch checked={participates} onCheckedChange={handleToggle} disabled={updateEmployee.isPending} />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          className="w-20"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          onBlur={handleSavePriority}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          className="w-24"
          value={maxActiveLeads}
          onChange={(e) => setMaxActiveLeads(e.target.value)}
          onBlur={handleSaveMaxActiveLeads}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={employee.accepts_appointments}
          onCheckedChange={(checked) => updateEmployee.mutateAsync({ id: employee.id, payload: { accepts_appointments: checked } })}
          disabled={updateEmployee.isPending}
        />
      </TableCell>
    </TableRow>
  )
}

export function DistributionPage() {
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees()
  const { data: company, isLoading: isLoadingCompany } = useCompany()
  const updateCompany = useUpdateCompany()
  const { toast } = useToast()
  const [redistributionDays, setRedistributionDays] = useState('7')

  useEffect(() => {
    if (company) setRedistributionDays(String(company.redistribution_after_days))
  }, [company])

  async function handleToggleRedistribution(enabled: boolean) {
    try {
      await updateCompany.mutateAsync({ auto_redistribution_enabled: enabled })
      toast({ title: enabled ? 'Redistribuição automática ativada' : 'Redistribuição automática desativada' })
    } catch (error) {
      toast({
        title: 'Não foi possível atualizar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleSaveRedistributionDays() {
    const days = Number(redistributionDays)
    if (!Number.isInteger(days) || days < 1 || days > 90) return
    try {
      await updateCompany.mutateAsync({ redistribution_after_days: days })
      toast({ title: 'Prazo atualizado' })
    } catch (error) {
      toast({
        title: 'Não foi possível atualizar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shuffle className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Distribuição</h1>
          <p className="text-sm text-muted-foreground">
            Quem recebe Leads/Conversas no rodízio automático, e quando redistribuir
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rodízio por funcionário</CardTitle>
          <CardDescription>
            Um Lead sem responsável (ou uma conversa que precisa de humano) é atribuído automaticamente a quem
            estiver participando aqui - por prioridade, depois por quem está há mais tempo sem receber. Fora do
            horário de trabalho cadastrado (se houver) ou com o limite de leads ativos atingido, o funcionário é
            pulado até liberar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingEmployees ? (
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
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Participa do rodízio</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Limite de leads ativos</TableHead>
                  <TableHead>Recebe agendamentos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee) => (
                  <EmployeeDistributionRow key={employee.id} employee={employee} />
                ))}
                {employees?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum funcionário cadastrado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isLoadingCompany ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        company && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Redistribuição por inatividade</CardTitle>
              <CardDescription>
                Redistribui um lead pra outro atendente se a conversa continuar aberta com o mesmo responsável por
                muito tempo, contado desde o início da conversa (não da última mensagem).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto_redistribution">Ativar redistribuição automática</Label>
                <Switch
                  id="auto_redistribution"
                  checked={company.auto_redistribution_enabled}
                  onCheckedChange={handleToggleRedistribution}
                  disabled={updateCompany.isPending}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="redistribution_after_days">Redistribuir após (dias)</Label>
                  <Input
                    id="redistribution_after_days"
                    type="number"
                    min={1}
                    max={90}
                    className="w-24"
                    value={redistributionDays}
                    onChange={(e) => setRedistributionDays(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveRedistributionDays}
                  disabled={
                    updateCompany.isPending || redistributionDays === String(company.redistribution_after_days)
                  }
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
