import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bug, ExternalLink } from 'lucide-react'
import { platformAdminService } from '@/platform-admin/services/platformAdminService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { SentryIssueLevel } from '@/types/platformAdmin'

const STATUS_OPTIONS = [
  { value: 'unresolved', label: 'Não resolvidos' },
  { value: 'resolved', label: 'Resolvidos' },
  { value: 'ignored', label: 'Ignorados' },
] as const

const LEVEL_VARIANT: Record<SentryIssueLevel, BadgeProps['variant']> = {
  fatal: 'destructive',
  error: 'destructive',
  warning: 'warning',
  info: 'secondary',
  debug: 'secondary',
}

const SOURCE_LABEL: Record<string, string> = {
  backend: 'Backend',
  frontend: 'Frontend',
}

/** Cross-tenant - erros de aplicação (Sentry), distinto do log de auditoria ("quem fez o quê"). */
export function PlatformErrorsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]['value']>('unresolved')

  const { data, isLoading } = useQuery({
    queryKey: ['platform-admin', 'errors', status],
    queryFn: () => platformAdminService.listErrors(status),
  })

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/platform-admin/companies')}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Erros de aplicação</h1>
        <p className="text-sm text-muted-foreground">Issues capturadas pelo Sentry, backend e frontend</p>
      </div>

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={status === option.value ? 'default' : 'outline'}
            onClick={() => setStatus(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>{data?.issues.length ?? 0} issue(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data && !data.configured ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <Bug className="h-8 w-8" />
              <p className="text-sm">
                Sentry não configurado. Defina SENTRY_API_AUTH_TOKEN, SENTRY_ORGANIZATION_SLUG e as env vars de
                projeto pra ver os erros aqui.
              </p>
            </div>
          ) : data?.issues.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <Bug className="h-8 w-8" />
              <p className="text-sm">Nenhuma issue nesse status.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Ocorrências</TableHead>
                  <TableHead>Usuários</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(issue.last_seen).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{SOURCE_LABEL[issue.source] ?? issue.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <a
                        href={issue.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        {issue.title}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      {issue.culprit && <p className="text-xs text-muted-foreground">{issue.culprit}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={LEVEL_VARIANT[issue.level] ?? 'secondary'}>{issue.level}</Badge>
                    </TableCell>
                    <TableCell>{issue.count}</TableCell>
                    <TableCell>{issue.user_count}</TableCell>
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
