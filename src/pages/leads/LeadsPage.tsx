import { useState } from 'react'
import { MoreHorizontal, Plus, Pencil, UserCheck, Archive } from 'lucide-react'
import { useLeads, useArchiveLead } from '@/hooks/useLeads'
import { useEmployees } from '@/hooks/useEmployees'
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
import { LEAD_STATUS_LABEL, type Lead, type LeadStatus } from '@/types/lead'
import { CreateLeadDialog } from '@/pages/leads/CreateLeadDialog'
import { EditLeadDialog } from '@/pages/leads/EditLeadDialog'
import { AssignLeadDialog } from '@/pages/leads/AssignLeadDialog'

const statusLabel = LEAD_STATUS_LABEL

const statusVariant: Record<LeadStatus, 'success' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
}

export function LeadsPage() {
  const { data: leads, isLoading } = useLeads()
  const { data: employees } = useEmployees()
  const archiveLead = useArchiveLead()
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [assignLead, setAssignLead] = useState<Lead | null>(null)

  const employeeNameById = new Map((employees ?? []).map((employee) => [employee.id, employee.full_name]))

  async function handleArchive(lead: Lead) {
    if (!window.confirm(`Arquivar o lead "${lead.full_name ?? 'sem nome'}"?`)) return
    try {
      await archiveLead.mutateAsync(lead.id)
      toast({ title: 'Lead arquivado', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Não foi possível arquivar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Acompanhe e atribua os contatos recebidos</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os leads</CardTitle>
          <CardDescription>{leads?.length ?? 0} no total</CardDescription>
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
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.full_name ?? 'Lead sem nome'}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.phone}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[lead.status]}>{statusLabel[lead.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(lead.assigned_employee_id && employeeNameById.get(lead.assigned_employee_id)) ?? 'Não atribuído'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditLead(lead)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAssignLead(lead)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Atribuir responsável
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleArchive(lead)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Arquivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {leads?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhum lead cadastrado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateLeadDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editLead && (
        <EditLeadDialog lead={editLead} open={!!editLead} onOpenChange={(open) => !open && setEditLead(null)} />
      )}
      {assignLead && (
        <AssignLeadDialog lead={assignLead} open={!!assignLead} onOpenChange={(open) => !open && setAssignLead(null)} />
      )}
    </div>
  )
}
