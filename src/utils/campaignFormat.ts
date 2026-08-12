import { WEEKDAY_LABEL_SHORT, type Campaign, type CampaignStatus } from '@/types/campaign'

export const CAMPAIGN_STATUS_VARIANT: Record<CampaignStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  SCHEDULED: 'secondary',
  QUEUED: 'secondary',
  RUNNING: 'warning',
  COMPLETED: 'success',
  CANCELED: 'destructive',
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function formatDateOnly(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

export function scheduleSummary(campaign: Campaign): string | null {
  if (campaign.recurrence_days_of_week?.length) {
    const days = campaign.recurrence_days_of_week.map((d) => WEEKDAY_LABEL_SHORT[d]).join(', ')
    const until = campaign.recurrence_end_date ? ` até ${formatDateOnly(campaign.recurrence_end_date)}` : ''
    return `Toda(o) ${days}${until}`
  }
  if (campaign.status === 'SCHEDULED' && campaign.scheduled_at) {
    return `Agendada pra ${formatDateTime(campaign.scheduled_at)}`
  }
  return null
}
