export interface Note {
  id: string
  company_id: string
  lead_id: string
  author_employee_id: string
  content: string
  created_at: string
}

export interface NoteCreateRequest {
  content: string
}
