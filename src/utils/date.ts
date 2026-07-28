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
