export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface WorkSchedule {
  id: string
  employee_id: string
  day_of_week: Weekday
  start_time: string // "HH:MM"
  end_time: string // "HH:MM"
  created_at: string
}

export interface WorkScheduleCreateRequest {
  day_of_week: Weekday
  start_time: string
  end_time: string
}

export interface WorkScheduleUpdateRequest {
  day_of_week?: Weekday
  start_time?: string
  end_time?: string
}

// 0 = Domingo ... 6 = Sábado — mesma convenção do backend (WorkSchedule.day_of_week,
// estilo Date.getDay()). Não confundir com WEEKDAY_LABEL de types/campaign.ts, que
// usa a convenção Python (0=Segunda..6=Domingo) para recurrence_days_of_week.
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
}
