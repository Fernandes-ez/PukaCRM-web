import { Link } from 'react-router-dom'
import { AlertCircle, ArrowUpRight, Contact, MessageSquare, Users2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLeads } from '@/hooks/useLeads'
import { useConversations } from '@/hooks/useConversations'
import { useEmployees } from '@/hooks/useEmployees'
import { cn } from '@/utils/cn'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { LEAD_STATUS_LABEL } from '@/types/lead'
import { compareDatesDesc, isValidDateString } from '@/utils/date'
import { LeadsTrendChart } from '@/components/charts/LeadsTrendChart'
import { LeadsStatusChart } from '@/components/charts/LeadsStatusChart'

export function DashboardPage() {
  const { employee } = useAuth()
  const { data: leads, isLoading: isLoadingLeads } = useLeads()
  const { data: conversations, isLoading: isLoadingConversations } = useConversations()
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees()

  const openLeads = leads?.filter((l) => l.status === 'ACTIVE').length ?? 0
  const needsAttention = conversations?.filter((c) => c.needs_human_attention).length ?? 0
  const activeEmployees = employees?.filter((e) => e.status === 'ACTIVE').length ?? 0

  const stats = [
    { label: 'Leads em aberto', value: openLeads, icon: Contact, loading: isLoadingLeads, to: '/leads' },
    {
      label: 'Conversas aguardando atenção',
      value: needsAttention,
      icon: AlertCircle,
      loading: isLoadingConversations,
      to: '/conversations',
      highlight: needsAttention > 0,
    },
    { label: 'Funcionários ativos', value: activeEmployees, icon: Users2, loading: isLoadingEmployees, to: '/employees' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Olá, {employee?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground">Aqui está um resumo do atendimento da sua empresa</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Link key={stat.label} to={stat.to} className="group">
            <Card
              notch={index % 2 === 0 ? 'tr' : 'bl'}
              className={cn(
                'transition-all group-hover:-translate-y-0.5',
                stat.highlight
                  ? 'group-hover:drop-shadow-[0_10px_22px_rgb(220_38_38_/_35%)]'
                  : 'group-hover:drop-shadow-[var(--shadow-glow-filter)]',
              )}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className={cn(
                    'btn-cut-sm flex h-11 w-11 shrink-0 items-center justify-center',
                    stat.highlight ? 'bg-destructive/10 text-destructive' : 'bg-brand-600 text-white',
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  {stat.loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-3xl font-bold leading-none tabular-nums">{stat.value}</p>
                  )}
                  <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LeadsTrendChart leads={leads ?? []} isLoading={isLoadingLeads} />
        <LeadsStatusChart leads={leads ?? []} isLoading={isLoadingLeads} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2.5 space-y-0">
            <span className="btn-cut-sm flex h-8 w-8 items-center justify-center bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              <Contact className="h-4 w-4" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">Leads recentes</p>
              <p className="text-xs text-muted-foreground">Últimos contatos cadastrados</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoadingLeads ? (
              <Skeleton className="h-24 w-full" />
            ) : leads && leads.length > 0 ? (
              leads
                .slice()
                .sort((a, b) => {
                  // Leads sem created_at válido (bug conhecido do backend na criação)
                  // aparecem primeiro — são quase sempre os mais recentes, não os mais antigos.
                  const validA = isValidDateString(a.created_at)
                  const validB = isValidDateString(b.created_at)
                  if (validA !== validB) return validA ? 1 : -1
                  return compareDatesDesc(a.created_at, b.created_at)
                })
                .slice(0, 5)
                .map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent/60"
                  >
                    <span className="font-medium">
                      {lead.full_name ?? 'Lead sem nome'}
                      {!isValidDateString(lead.created_at) && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(data desconhecida)</span>
                      )}
                    </span>
                    <Badge variant="outline">{LEAD_STATUS_LABEL[lead.status]}</Badge>
                  </div>
                ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum lead cadastrado ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2.5 space-y-0">
            <span className="btn-cut-sm flex h-8 w-8 items-center justify-center bg-destructive/10 text-destructive">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">Conversas que precisam de atenção</p>
              <p className="text-xs text-muted-foreground">A IA sinalizou que um humano deve intervir</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoadingConversations ? (
              <Skeleton className="h-24 w-full" />
            ) : conversations && conversations.filter((c) => c.needs_human_attention).length > 0 ? (
              conversations
                .filter((c) => c.needs_human_attention)
                .slice(0, 5)
                .map((conversation) => (
                  <Link
                    key={conversation.id}
                    to={`/conversations/${conversation.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent/60"
                  >
                    <span className="font-medium">{conversation.lead_full_name ?? 'Lead sem nome'}</span>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </Link>
                ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma conversa pendente de atenção.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
