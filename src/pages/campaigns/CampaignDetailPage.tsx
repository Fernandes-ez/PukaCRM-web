import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Repeat, X } from 'lucide-react'
import { useCampaign, useCampaignRecipients, useCancelCampaign } from '@/hooks/useCampaigns'
import { useMessageTemplates } from '@/hooks/useMessageTemplates'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  CAMPAIGN_RECIPIENT_STATUS_LABEL,
  CAMPAIGN_STATUS_LABEL,
  type CampaignRecipientStatus,
} from '@/types/campaign'
import { CAMPAIGN_STATUS_VARIANT, formatDateTime, scheduleSummary } from '@/utils/campaignFormat'
import { formatRelativeTime } from '@/utils/date'
import { formatPhone } from '@/utils/phone'

const RECIPIENT_STATUS_VARIANT: Record<CampaignRecipientStatus, 'secondary' | 'success' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  SENT: 'success',
  FAILED: 'destructive',
  SKIPPED_OPT_OUT: 'outline',
  SKIPPED_ACTIVE_CONVERSATION: 'outline',
  CANCELED: 'outline',
}

export function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { toast } = useToast()
  const { data: campaign, isLoading } = useCampaign(campaignId)
  const activelyProcessing =
    campaign?.status === 'QUEUED' || campaign?.status === 'RUNNING' || campaign?.status === 'SCHEDULED'
  const { data: recipients, isLoading: recipientsLoading } = useCampaignRecipients(campaignId, !!activelyProcessing)
  const { data: templates } = useMessageTemplates()
  const cancelCampaign = useCancelCampaign()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const template = templates?.find((t) => t.id === campaign?.message_template_id)

  async function handleCancel() {
    if (!campaignId) return
    try {
      await cancelCampaign.mutateAsync(campaignId)
      toast({ title: 'Campanha cancelada', variant: 'success' })
      setConfirmCancel(false)
    } catch (error) {
      toast({
        title: 'Não foi possível cancelar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const backLink = (
    <Link
      to="/campanhas"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar pras Campanhas
    </Link>
  )

  if (isLoading || !campaign) {
    return (
      <div className="max-w-4xl space-y-6">
        {backLink}
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const processed = campaign.sent_count + campaign.failed_count
  const pct = campaign.total_recipients > 0 ? Math.round((processed / campaign.total_recipients) * 100) : 0
  const remaining = Math.max(campaign.total_recipients - processed, 0)
  const canCancel = campaign.status === 'SCHEDULED' || campaign.status === 'QUEUED' || campaign.status === 'RUNNING'
  const isRecurring = !!campaign.recurrence_days_of_week?.length
  const schedule = scheduleSummary(campaign)

  return (
    <div className="max-w-4xl space-y-6">
      {backLink}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">
            {template?.name ?? 'Template não encontrado'} · criada {formatRelativeTime(campaign.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isRecurring && (
            <Badge variant="outline" className="gap-1">
              <Repeat className="h-3 w-3" />
              Recorrente
            </Badge>
          )}
          <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status]}>{CAMPAIGN_STATUS_LABEL[campaign.status]}</Badge>
          {canCancel && (
            <Button variant="outline" size="sm" onClick={() => setConfirmCancel(true)}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progresso</CardTitle>
          {schedule ? (
            <CardDescription>{schedule}</CardDescription>
          ) : (
            <CardDescription>Disparo único, sem agendamento</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{pct}% processado</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Destinatários</p>
              <p className="text-lg font-semibold">{campaign.total_recipients}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Enviados</p>
              <p className="text-lg font-semibold text-success">{campaign.sent_count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Falharam</p>
              <p className="text-lg font-semibold text-destructive">{campaign.failed_count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restam</p>
              <p className="text-lg font-semibold">{remaining}</p>
            </div>
          </div>

          <div className="space-y-0.5 text-xs text-muted-foreground">
            {campaign.started_at && <p>Iniciada em {formatDateTime(campaign.started_at)}</p>}
            {campaign.completed_at && <p>Concluída em {formatDateTime(campaign.completed_at)}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Destinatários</CardTitle>
          <CardDescription>{recipients?.length ?? 0} no total</CardDescription>
        </CardHeader>
        <CardContent>
          {recipientsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recipients?.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum destinatário ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients?.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium">{recipient.lead_full_name ?? 'Lead sem nome'}</TableCell>
                    <TableCell className="text-muted-foreground">{formatPhone(recipient.lead_phone)}</TableCell>
                    <TableCell>
                      <Badge variant={RECIPIENT_STATUS_VARIANT[recipient.status]}>
                        {CAMPAIGN_RECIPIENT_STATUS_LABEL[recipient.status]}
                      </Badge>
                      {recipient.status === 'FAILED' && recipient.error && (
                        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{recipient.error}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {recipient.sent_at ? formatDateTime(recipient.sent_at) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar campanha"
        description={`Cancelar "${campaign.name}"? Quem ainda não recebeu não vai mais receber.`}
        confirmLabel="Cancelar campanha"
        variant="destructive"
        isPending={cancelCampaign.isPending}
        onConfirm={handleCancel}
      />
    </div>
  )
}
