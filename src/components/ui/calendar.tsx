import { useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_NAME = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

interface CalendarProps {
  value: Date | null
  onChange: (date: Date) => void
  /** Dias antes desta data ficam desabilitados. */
  minDate?: Date
  className?: string
  'aria-label': string
}

export function Calendar({ value, onChange, minDate, className, 'aria-label': ariaLabel }: CalendarProps) {
  const today = startOfDay(new Date())
  const min = minDate ? startOfDay(minDate) : null
  const initialMonthSource = value ?? (min && min > today ? min : today)
  const [viewMonth, setViewMonth] = useState(() => new Date(initialMonthSource.getFullYear(), initialMonthSource.getMonth(), 1))

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = new Array(startWeekday).fill(null)
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(new Date(year, month, day))
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  const focusableDate = value && !(min && value < min) ? value : today
  const canGoPrevMonth = !min || new Date(year, month, 0) >= min

  function focusDay(date: Date) {
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-daykey="${dayKey(date)}"]`)?.focus()
    })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    const delta = deltas[event.key]
    if (delta === undefined) return
    event.preventDefault()
    const next = new Date(date)
    next.setDate(next.getDate() + delta)
    if (next.getMonth() !== month || next.getFullYear() !== year) {
      setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    }
    focusDay(next)
  }

  return (
    <div className={cn('w-full max-w-xs rounded-lg border bg-card p-3', className)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          disabled={!canGoPrevMonth}
          aria-label="Mês anterior"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold" aria-live="polite">
          {MONTH_NAME[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          aria-label="Próximo mês"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div role="grid" aria-label={ariaLabel}>
        <div role="row" className="grid grid-cols-7">
          {WEEKDAY_SHORT.map((label) => (
            <div
              key={label}
              role="columnheader"
              aria-hidden="true"
              className="py-1 text-center text-[11px] font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        {weeks.map((weekRow, weekIndex) => (
          <div key={weekIndex} role="row" className="grid grid-cols-7">
            {weekRow.map((date, dayIndex) => {
              if (!date) return <div key={dayIndex} aria-hidden="true" />
              const disabled = !!min && date < min
              const selected = !!value && isSameDay(date, value)
              const isToday = isSameDay(date, today)
              return (
                <button
                  key={dayIndex}
                  type="button"
                  role="gridcell"
                  data-daykey={dayKey(date)}
                  disabled={disabled}
                  tabIndex={isSameDay(date, focusableDate) ? 0 : -1}
                  aria-selected={selected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  onClick={() => onChange(date)}
                  onKeyDown={(e) => handleKeyDown(e, date)}
                  className={cn(
                    'mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected && 'bg-brand-600 text-white hover:bg-brand-700',
                    !selected && isToday && 'font-semibold text-brand-600',
                    disabled && 'pointer-events-none text-muted-foreground/40',
                  )}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
