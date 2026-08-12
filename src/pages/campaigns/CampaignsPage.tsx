import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Plus, Repeat, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCampaigns, useCancelCampaign } from '@/hooks/useCampaigns'
import { useMessageTemplates } from '@/hooks/useMessageTemplates'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CAMPAIGN_STATUS_LABEL, type Campaign } from '@/types/campaign'
import { CAMPAIGN_STATUS_VARIANT, scheduleSummary } from '@/utils/campaignFormat'
import { formatRelativeTime } from '@/utils/date'

function CampaignRow({ campaign, templateName }: { campaign: Campaign; templateName: string }) {
  const cancelCampaign = useCancelCampaign()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const processed = campaign.sent_count + campaign.failed_count
  const pct = campaign.total_recipients > 0 ? Math.round((processed / campaign.total_recipients) * 100) : 0
  const canCancel = campaign.status === 'SCHEDULED' || campaign.status === 'QUEUED' || campaign.status === 'RUNNING'
  const isRecurring = !!campaign.recurrence_days_of_week?.length
  const schedule = scheduleSummary(campaign)

  async function handleCancel() {
    try {
      await cancelCampaign.mutateAsync(campaign.id)
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/campanhas/${campaign.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/campanhas/${campaign.id}`)
      }}
      className="cursor-pointer space-y-2 rounded-md border p-3 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{campaign.name}</p>
          <p className="text-xs text-muted-foreground">
            {templateName} · criada {formatRelativeTime(campaign.created_at)}
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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                setConfirmCancel(true)
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {schedule && <p className="text-xs text-muted-foreground">{schedule}</p>}

      {campaign.total_recipients > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {processed} de {campaign.total_recipients} processados
            {campaign.sent_count > 0 && ` · ${campaign.sent_count} enviado(s)`}
            {campaign.failed_count > 0 && ` · ${campaign.failed_count} falhou(aram)`}
          </p>
        </div>
      )}

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

export function CampaignsPage() {
  const { data: campaigns, isLoading } = useCampaigns()
  const { data: templates } = useMessageTemplates()
  const { hasPermission } = useAuth()
  const navigate = useNavigate()

  const templateNameById = new Map((templates ?? []).map((t) => [t.id, t.name]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campanhas</h1>
          <p className="text-sm text-muted-foreground">Envie um template pra um público filtrado, com acompanhamento</p>
        </div>
        {hasPermission('CAMPAIGNS', 'campaign', 'CREATE') && (
          <Button onClick={() => navigate('/campanhas/nova')}>
            <Plus className="h-4 w-4" />
            Nova campanha
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as campanhas</CardTitle>
          <CardDescription>{campaigns?.length ?? 0} no total</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : campaigns?.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <Megaphone className="h-8 w-8" />
              <p className="text-sm">Nenhuma campanha disparada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns?.map((campaign) => (
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  templateName={templateNameById.get(campaign.message_template_id) ?? '—'}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
