import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { platformAdminService } from '@/platform-admin/services/platformAdminService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AUDIT_ACTION_LABEL, resolveActorLabel } from '@/types/auditLog'

/** Cross-tenant - lista de todas as empresas, sem filtro por company_id. */
export function PlatformAuditLogPage() {
  const navigate = useNavigate()

  const { data: entries, isLoading } = useQuery({
    queryKey: ['platform-admin', 'audit-log'],
    queryFn: () => platformAdminService.listAuditLog(),
  })

  const { data: companies } = useQuery({
    queryKey: ['platform-admin', 'companies'],
    queryFn: platformAdminService.listCompanies,
  })

  const companyNameById = new Map((companies ?? []).map((c) => [c.id, c.name]))

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/platform-admin/companies')}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoria — todas as empresas</h1>
        <p className="text-sm text-muted-foreground">Ações sensíveis registradas em qualquer conta de cliente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>{entries?.length ?? 0} registro(s) mais recente(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : entries?.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <ScrollText className="h-8 w-8" />
              <p className="text-sm">Nenhum registro de auditoria ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Quem</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{companyNameById.get(entry.company_id) ?? entry.company_id}</TableCell>
                    <TableCell>{resolveActorLabel(entry)}</TableCell>
                    <TableCell>{AUDIT_ACTION_LABEL[entry.action] ?? entry.action}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.entity_type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
