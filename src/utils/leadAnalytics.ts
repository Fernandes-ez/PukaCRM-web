import { LEAD_STATUS_LABEL, type Lead, type LeadStatus } from '@/types/lead'

export type Granularity = 'day' | 'week' | 'month'

export interface TrendPoint {
  key: string
  label: string
  fullLabel: string
  count: number
}

/** Ordem fixa do anel de cores (nunca reordenar — é o que garante a separação CVD validada). */
export const LEAD_STATUS_ORDER: LeadStatus[] = ['ACTIVE', 'INACTIVE']

export const LEAD_STATUS_COLOR: Record<LeadStatus, { light: string; dark: string }> = {
  ACTIVE: { light: '#008300', dark: '#008300' },
  INACTIVE: { light: '#4a3aa7', dark: '#9085e9' },
}

const WINDOW: Record<Granularity, number> = { day: 14, week: 8, month: 6 }

const WEEKDAY_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MONTH_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function startOfWeek(date: Date): Date {
  const result = startOfDay(date)
  result.setDate(result.getDate() - result.getDay())
  return result
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10)
}

function weekKey(date: Date): string {
  return startOfWeek(date).toISOString().slice(0, 10)
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`
}

export const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
}

/** Gera os N períodos mais recentes (com contagem zerada) e soma os leads criados em cada um. */
export function buildLeadsTrend(leads: Lead[], granularity: Granularity): TrendPoint[] {
  const now = new Date()
  const total = WINDOW[granularity]
  const buckets: TrendPoint[] = []

  for (let i = total - 1; i >= 0; i--) {
    if (granularity === 'day') {
      const date = startOfDay(now)
      date.setDate(date.getDate() - i)
      buckets.push({
        key: dayKey(date),
        label: String(date.getDate()),
        fullLabel: `${WEEKDAY_LONG[date.getDay()]}, ${date.getDate()} de ${MONTH_LONG[date.getMonth()]}`,
        count: 0,
      })
    } else if (granularity === 'week') {
      const date = startOfWeek(now)
      date.setDate(date.getDate() - i * 7)
      const end = new Date(date)
      end.setDate(end.getDate() + 6)
      buckets.push({
        key: weekKey(date),
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        fullLabel: `${date.getDate()}/${date.getMonth() + 1} a ${end.getDate()}/${end.getMonth() + 1}`,
        count: 0,
      })
    } else {
      const date = startOfMonth(now)
      date.setMonth(date.getMonth() - i)
      buckets.push({
        key: monthKey(date),
        label: MONTH_SHORT[date.getMonth()],
        fullLabel: `${MONTH_LONG[date.getMonth()]} de ${date.getFullYear()}`,
        count: 0,
      })
    }
  }

  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  for (const lead of leads) {
    const created = new Date(lead.created_at)
    if (Number.isNaN(created.getTime())) continue

    const key = granularity === 'day' ? dayKey(created) : granularity === 'week' ? weekKey(created) : monthKey(created)
    const bucket = bucketByKey.get(key)
    if (bucket) bucket.count += 1
  }

  return buckets
}

export interface StatusSlice {
  status: LeadStatus
  label: string
  count: number
  percent: number
}

/** Distribuição de leads por status, na ordem fixa validada (ver LEAD_STATUS_ORDER). */
export function buildLeadsByStatus(leads: Lead[]): StatusSlice[] {
  const counts: Record<LeadStatus, number> = {
    ACTIVE: 0,
    INACTIVE: 0,
  }
  for (const lead of leads) counts[lead.status] += 1

  const total = leads.length
  return LEAD_STATUS_ORDER.map((status) => ({
    status,
    label: LEAD_STATUS_LABEL[status],
    count: counts[status],
    percent: total > 0 ? (counts[status] / total) * 100 : 0,
  })).filter((slice) => slice.count > 0)
}
