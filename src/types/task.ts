export type TaskStatus = 'PENDING' | 'DONE'

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: 'Pendente',
  DONE: 'Concluída',
}

export interface Task {
  id: string
  company_id: string
  lead_id: string | null
  assigned_employee_id: string
  created_by_employee_id: string
  title: string
  description: string | null
  due_date: string | null
  status: TaskStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskCreateRequest {
  lead_id?: string
  assigned_employee_id: string
  title: string
  description?: string
  due_date?: string
}

export interface TaskUpdateRequest {
  assigned_employee_id?: string
  title?: string
  description?: string
  due_date?: string
  status?: TaskStatus
}
