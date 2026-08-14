import type { AppointmentStatus } from '@/types/appointment'

export const APPOINTMENT_STATUS_VARIANT: Record<AppointmentStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  SCHEDULED: 'secondary',
  CONFIRMED: 'warning',
  COMPLETED: 'success',
  CANCELED: 'destructive',
  NO_SHOW: 'destructive',
}

/**
 * WorkSchedule.day_of_week usa 0=Domingo..6=Sábado (estilo Date.getDay()) -
 * NÃO a convenção de WEEKDAY_LABEL em types/campaign.ts, que segue
 * date.weekday() do Python (0=Segunda..6=Domingo) pra recurrence_days_of_week.
 * Usar essa aqui pra qualquer coisa ligada à Agenda, nunca a de Campaign.
 */
export function toWorkScheduleWeekday(date: Date): number {
  return date.getDay()
}

export function formatDateOnly(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function toDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Domingo (0) como início da semana, mesma convenção de WorkSchedule.day_of_week. */
export function startOfWeek(date: Date): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - result.getDay())
  result.setHours(0, 0, 0, 0)
  return result
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}
