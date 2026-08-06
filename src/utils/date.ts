/**
 * Compara duas datas (ISO string) da mais recente pra mais antiga, pra uso em `.sort()`.
 * Datas ausentes ou inválidas não quebram a ordenação — vão pro final da lista.
 */
export function compareDatesDesc(a: string | null | undefined, b: string | null | undefined): number {
  const timeA = a ? new Date(a).getTime() : NaN
  const timeB = b ? new Date(b).getTime() : NaN
  const validA = !Number.isNaN(timeA)
  const validB = !Number.isNaN(timeB)

  if (!validA && !validB) return 0
  if (!validA) return 1
  if (!validB) return -1
  return timeB - timeA
}

export function isValidDateString(value: string | null | undefined): boolean {
  return !!value && !Number.isNaN(new Date(value).getTime())
}

export function formatDate(value: string | null | undefined): string {
  if (!isValidDateString(value)) return '—'
  return new Date(value as string).toLocaleDateString('pt-BR')
}

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const RELATIVE_TIME_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

/** "há 5 min", "há 2 h" etc. Cai pra "agora" abaixo de 1 minuto. */
export function formatRelativeTime(value: string | null | undefined): string {
  if (!isValidDateString(value)) return '—'
  const diffSeconds = (new Date(value as string).getTime() - Date.now()) / 1000

  for (const [unit, secondsInUnit] of RELATIVE_TIME_STEPS) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return RELATIVE_TIME_FORMATTER.format(Math.round(diffSeconds / secondsInUnit), unit)
    }
  }
  return 'agora'
}
