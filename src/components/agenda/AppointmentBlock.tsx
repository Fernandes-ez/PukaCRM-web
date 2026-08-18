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

// Abaixo disso não cabem as 3 linhas empilhadas (horário, nome, tipo) sem
// estourar a altura do bloco - um agendamento de 30min (padrão "Atendimento")
// já cai aqui. Vira layout compacto de 1 linha só, sem o tipo.
const COMPACT_HEIGHT_THRESHOLD_PX = 44

export function AppointmentBlock({ appointment, style, onClick }: AppointmentBlockProps) {
  const dimmed = STATUS_DIM.includes(appointment.status)
  const heightPx = typeof style?.height === 'number' ? style.height : undefined
  const compact = heightPx !== undefined && heightPx < COMPACT_HEIGHT_THRESHOLD_PX
  const leadLabel = appointment.lead_full_name ?? appointment.lead_phone

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={style}
      className={cn(
        'absolute left-0.5 right-0.5 overflow-hidden rounded-md border px-1.5 text-left text-[11px] leading-tight shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'flex items-center gap-1 py-0.5' : 'py-1',
        dimmed ? 'border-border bg-muted text-muted-foreground line-through' : 'border-brand-300 bg-brand-50 text-brand-900 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-100',
      )}
    >
      <span className="flex shrink-0 items-center gap-1 font-semibold">
        {formatTimeOnly(appointment.starts_at)}
        {appointment.created_by === 'AI' && <Sparkles className="h-2.5 w-2.5 shrink-0" aria-label="Marcado pela IA" />}
      </span>
      <span className={cn('truncate', !compact && 'block')}>{leadLabel}</span>
      {!compact && <span className="block truncate opacity-80">{appointment.appointment_type_name}</span>}
    </button>
  )
}
