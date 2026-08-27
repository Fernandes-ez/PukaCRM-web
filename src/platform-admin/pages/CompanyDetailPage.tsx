import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, PauseCircle, PlayCircle } from 'lucide-react'
import { platformAdminService } from '@/platform-admin/services/platformAdminService'
import { ApiError } from '@/services/apiClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { COMPANY_STATUS_LABEL } from '@/types/platformAdmin'

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [confirmToggle, setConfirmToggle] = useState(false)

  const { data: company, isLoading } = useQuery({
    queryKey: ['platform-admin', 'companies', id],
    queryFn: () => platformAdminService.getCompany(id as string),
    enabled: !!id,
  })

  const toggleStatus = useMutation({
    mutationFn: () =>
      platformAdminService.setCompanyStatus(id as string, company?.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'companies'] })
      toast({ title: 'Status atualizado', variant: 'success' })
      setConfirmToggle(false)
    },
    onError: (error) => {
      toast({
        title: 'Não foi possível atualizar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    },
  })

  if (isLoading || !company) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const willSuspend = company.status !== 'SUSPENDED'

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/platform-admin/companies')}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
          <p className="text-sm text-muted-foreground">{company.slug}</p>
        </div>
        <Badge variant={company.status === 'SUSPENDED' ? 'warning' : 'success'}>
          {COMPANY_STATUS_LABEL[company.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da conta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm">{company.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
            <p className="text-sm">{company.document ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plano</p>
            <p className="text-sm">{company.subscription_plan ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status da assinatura</p>
            <p className="text-sm">{company.subscription_status ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Criada em</p>
            <p className="text-sm">{new Date(company.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações administrativas</CardTitle>
          <CardDescription>
            Alternar entre ativa e suspensa - bloqueia/libera o acesso da equipe dessa empresa à plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant={willSuspend ? 'destructive' : 'default'}
            onClick={() => setConfirmToggle(true)}
          >
            {willSuspend ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            {willSuspend ? 'Suspender empresa' : 'Reativar empresa'}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={willSuspend ? 'Suspender empresa' : 'Reativar empresa'}
        description={
          willSuspend
            ? `Ninguém de "${company.name}" vai conseguir acessar a plataforma até reativar.`
            : `A equipe de "${company.name}" volta a acessar a plataforma normalmente.`
        }
        confirmLabel={willSuspend ? 'Suspender' : 'Reativar'}
        variant={willSuspend ? 'destructive' : 'default'}
        isPending={toggleStatus.isPending}
        onConfirm={() => toggleStatus.mutate()}
      />
    </div>
  )
}
