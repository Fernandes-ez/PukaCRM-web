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
  const bookedByAi = appointment.created_by === 'AI'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={style}
      className={cn(
        'absolute left-0.5 right-0.5 overflow-hidden border-l-4 bg-card px-1.5 text-left text-[11px] leading-tight transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'flex items-center gap-1 py-0.5' : 'py-1',
        dimmed
          ? 'border-l-border bg-muted text-muted-foreground line-through'
          : bookedByAi
            ? 'border-l-ponto text-foreground dark:border-l-ponto-claro'
            : 'border-l-ribalta text-foreground dark:border-l-ribalta-acesa',
      )}
    >
      <span className="flex shrink-0 items-center gap-1 font-mono font-semibold">
        {formatTimeOnly(appointment.starts_at)}
        {bookedByAi && <span className="text-ponto dark:text-ponto-claro" aria-label="Marcado pela IA">·IA</span>}
      </span>
      <span className={cn('truncate', !compact && 'block')}>{leadLabel}</span>
      {!compact && <span className="block truncate opacity-80">{appointment.appointment_type_name}</span>}
    </button>
  )
}
