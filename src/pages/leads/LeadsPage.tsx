import { useRef, useState } from 'react'
import { MoreHorizontal, Plus, Pencil, UserCheck, Archive, Download, Upload, FileDown, Loader2, MessageCircle } from 'lucide-react'
import { useLeads, useArchiveLead, useExportLeads, useImportLeads, useDownloadImportTemplate } from '@/hooks/useLeads'
import { useEmployees } from '@/hooks/useEmployees'
import { useAuth } from '@/contexts/AuthContext'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LEAD_STATUS_LABEL, type Lead, type LeadStatus } from '@/types/lead'
import { CreateLeadDialog } from '@/pages/leads/CreateLeadDialog'
import { EditLeadDialog } from '@/pages/leads/EditLeadDialog'
import { AssignLeadDialog } from '@/pages/leads/AssignLeadDialog'
import { StartConversationDialog } from '@/pages/leads/StartConversationDialog'

const statusLabel = LEAD_STATUS_LABEL

const statusVariant: Record<LeadStatus, 'success' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
}

export function LeadsPage() {
  const { data: leads, isLoading } = useLeads()
  const { data: employees } = useEmployees()
  const archiveLead = useArchiveLead()
  const exportLeads = useExportLeads()
  const importLeads = useImportLeads()
  const downloadTemplate = useDownloadImportTemplate()
  const { hasPermission } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [assignLead, setAssignLead] = useState<Lead | null>(null)
  const [archiveLeadTarget, setArchiveLeadTarget] = useState<Lead | null>(null)
  const [startConversationLead, setStartConversationLead] = useState<Lead | null>(null)

  const employeeNameById = new Map((employees ?? []).map((employee) => [employee.id, employee.full_name]))

  async function handleArchive() {
    if (!archiveLeadTarget) return
    try {
      await archiveLead.mutateAsync(archiveLeadTarget.id)
      toast({ title: 'Lead arquivado', variant: 'success' })
      setArchiveLeadTarget(null)
    } catch (error) {
      toast({
        title: 'Não foi possível arquivar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    try {
      const blob = await exportLeads.mutateAsync(format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `leads.${format}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Não foi possível exportar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleDownloadTemplate(format: 'csv' | 'xlsx') {
    try {
      const blob = await downloadTemplate.mutateAsync(format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `modelo-leads.${format}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Não foi possível baixar o modelo',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const result = await importLeads.mutateAsync(file)
      toast({
        title: `${result.created} lead(s) importado(s)`,
        description: result.skipped.length
          ? `${result.skipped.length} linha(s) ignorada(s) — ex: ${result.skipped[0].reason}`
          : undefined,
      })
    } catch (error) {
      toast({
        title: 'Não foi possível importar',
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
        <div className="flex items-center gap-2">
          {hasPermission('LEADS', 'lead', 'EXPORT') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exportLeads.isPending}>
                  {exportLeads.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>CSV (.csv)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {hasPermission('LEADS', 'lead', 'IMPORT') && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={handleImportFile}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={importLeads.isPending}>
                    {importLeads.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Importar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher arquivo (.csv ou .xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDownloadTemplate('xlsx')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Baixar modelo (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadTemplate('csv')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Baixar modelo (.csv)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo lead
          </Button>
        </div>
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
                          {hasPermission('CONVERSATIONS', 'conversation', 'CREATE') && (
                            <DropdownMenuItem onClick={() => setStartConversationLead(lead)}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Iniciar conversa
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setArchiveLeadTarget(lead)}
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
      {startConversationLead && (
        <StartConversationDialog
          lead={startConversationLead}
          open={!!startConversationLead}
          onOpenChange={(open) => !open && setStartConversationLead(null)}
        />
      )}
      {archiveLeadTarget && (
        <ConfirmDialog
          open={!!archiveLeadTarget}
          onOpenChange={(open) => !open && setArchiveLeadTarget(null)}
          title="Arquivar lead"
          description={`Arquivar o lead "${archiveLeadTarget.full_name ?? 'sem nome'}"?`}
          confirmLabel="Arquivar"
          variant="destructive"
          isPending={archiveLead.isPending}
          onConfirm={handleArchive}
        />
      )}
    </div>
  )
}
