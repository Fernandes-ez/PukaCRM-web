export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface WorkSchedule {
  id: string
  employee_id: string
  weekday: Weekday
  start_time: string // "HH:MM"
  end_time: string // "HH:MM"
  created_at: string
}

export interface WorkScheduleCreateRequest {
  weekday: Weekday
  start_time: string
  end_time: string
}

export interface WorkScheduleUpdateRequest {
  weekday?: Weekday
  start_time?: string
  end_time?: string
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}
