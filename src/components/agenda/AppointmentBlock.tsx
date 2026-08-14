import { Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatTimeOnly } from '@/utils/appointmentFormat'
import type { Appointment } from '@/types/appointment'

interface AppointmentBlockProps {
  appointment: Appointment
  style?: React.CSSProperties
  onClick: () => void
}

const STATUS_DIM: Appointment['status'][] = ['CANCELED', 'NO_SHOW']

export function AppointmentBlock({ appointment, style, onClick }: AppointmentBlockProps) {
  const dimmed = STATUS_DIM.includes(appointment.status)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={style}
      className={cn(
        'absolute left-0.5 right-0.5 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        dimmed ? 'border-border bg-muted text-muted-foreground line-through' : 'border-brand-300 bg-brand-50 text-brand-900 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-100',
      )}
    >
      <span className="flex items-center gap-1 font-semibold">
        {formatTimeOnly(appointment.starts_at)}
        {appointment.created_by === 'AI' && <Sparkles className="h-2.5 w-2.5 shrink-0" aria-label="Marcado pela IA" />}
      </span>
      <span className="block truncate">{appointment.lead_full_name ?? appointment.lead_phone}</span>
      <span className="block truncate opacity-80">{appointment.appointment_type_name}</span>
    </button>
  )
}
