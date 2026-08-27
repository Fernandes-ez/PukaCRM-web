import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Building2, ScrollText } from 'lucide-react'
import { platformAdminService } from '@/platform-admin/services/platformAdminService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { COMPANY_STATUS_LABEL, type CompanyStatus } from '@/types/platformAdmin'

const STATUS_VARIANT: Record<CompanyStatus, 'success' | 'secondary' | 'destructive' | 'warning'> = {
  ACTIVE: 'success',
  TRIAL: 'secondary',
  INACTIVE: 'destructive',
  SUSPENDED: 'warning',
}

export function CompaniesListPage() {
  const navigate = useNavigate()
  const { data: companies, isLoading } = useQuery({
    queryKey: ['platform-admin', 'companies'],
    queryFn: platformAdminService.listCompanies,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">Todas as contas de clientes na plataforma</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/platform-admin/audit-log')}>
          <ScrollText className="h-4 w-4" />
          Auditoria (todas as empresas)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as contas</CardTitle>
          <CardDescription>{companies?.length ?? 0} no total</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : companies?.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <Building2 className="h-8 w-8" />
              <p className="text-sm">Nenhuma empresa cadastrada ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead>Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies?.map((company) => (
                  <TableRow
                    key={company.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => navigate(`/platform-admin/companies/${company.id}`)}
                  >
                    <TableCell>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[company.status]}>{COMPANY_STATUS_LABEL[company.status]}</Badge>
                    </TableCell>
                    <TableCell>{company.subscription_plan ?? '—'}</TableCell>
                    <TableCell>{company.subscription_status ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
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
