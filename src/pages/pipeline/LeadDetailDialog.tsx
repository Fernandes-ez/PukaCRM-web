import { useState } from 'react'
import { Loader2, Trash2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/services/apiClient'
import { useEmployees } from '@/hooks/useEmployees'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes'
import { formatDate, formatRelativeTime } from '@/utils/date'
import { cn } from '@/utils/cn'
import type { Lead } from '@/types/lead'

interface LeadDetailDialogProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailDialog({ lead, open, onOpenChange }: LeadDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead.full_name ?? 'Lead sem nome'}</DialogTitle>
          <DialogDescription>{lead.phone}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="tasks">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="notes">Observações</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks">
            <TasksTab leadId={lead.id} />
          </TabsContent>
          <TabsContent value="notes">
            <NotesTab leadId={lead.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function TasksTab({ leadId }: { leadId: string }) {
  const { data: tasks, isLoading } = useTasks({ leadId })
  const { data: employees } = useEmployees()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { toast } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')

  const activeEmployees = (employees ?? []).filter((e) => e.status === 'ACTIVE')

  async function handleCreate() {
    if (!title.trim() || !assignedTo) return
    try {
      await createTask.mutateAsync({
        lead_id: leadId,
        assigned_employee_id: assignedTo,
        title: title.trim(),
        due_date: dueDate || undefined,
      })
      setTitle('')
      setDueDate('')
      setShowForm(false)
      toast({ title: 'Tarefa criada' })
    } catch (error) {
      toast({
        title: 'Não foi possível criar a tarefa',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleToggle(taskId: string, done: boolean) {
    try {
      await updateTask.mutateAsync({ id: taskId, payload: { status: done ? 'DONE' : 'PENDING' } })
    } catch (error) {
      toast({
        title: 'Não foi possível atualizar a tarefa',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && tasks?.length === 0 && !showForm && (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma tarefa ainda.</p>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {tasks?.map((task) => {
          const assignee = activeEmployees.find((e) => e.id === task.assigned_employee_id)
          const overdue = task.status === 'PENDING' && task.due_date && task.due_date < new Date().toISOString().slice(0, 10)
          return (
            <div key={task.id} className="flex items-start gap-2 rounded-md border p-2">
              <Checkbox
                checked={task.status === 'DONE'}
                onCheckedChange={(checked) => handleToggle(task.id, checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className={cn('text-sm', task.status === 'DONE' && 'text-muted-foreground line-through')}>
                  {task.title}
                </p>
                <p className={cn('text-xs text-muted-foreground', overdue && 'font-medium text-destructive')}>
                  {assignee?.full_name ?? 'Sem responsável'}
                  {task.due_date && ` · ${formatDate(task.due_date)}`}
                </p>
              </div>
              <button onClick={() => deleteTask.mutate(task.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {showForm ? (
        <div className="space-y-2 rounded-md border p-3">
          <Input placeholder="Título da tarefa" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleCreate} disabled={!title.trim() || !assignedTo || createTask.isPending}>
              {createTask.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Criar
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Nova tarefa
        </Button>
      )}
    </div>
  )
}

function NotesTab({ leadId }: { leadId: string }) {
  const { data: notes, isLoading } = useNotes(leadId)
  const { data: employees } = useEmployees()
  const createNote = useCreateNote(leadId)
  const deleteNote = useDeleteNote(leadId)
  const { toast } = useToast()
  const [content, setContent] = useState('')

  async function handleCreate() {
    if (!content.trim()) return
    try {
      await createNote.mutateAsync({ content: content.trim() })
      setContent('')
    } catch (error) {
      toast({
        title: 'Não foi possível adicionar a observação',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="note_content">Nova observação</Label>
        <Textarea
          id="note_content"
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Registre algo importante sobre esse lead..."
        />
        <Button type="button" size="sm" onClick={handleCreate} disabled={!content.trim() || createNote.isPending}>
          {createNote.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Adicionar
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && notes?.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma observação ainda.</p>
      )}

      <div className="max-h-56 space-y-2 overflow-y-auto">
        {notes?.map((note) => {
          const author = employees?.find((e) => e.id === note.author_employee_id)
          return (
            <div key={note.id} className="rounded-md border p-2">
              <p className="whitespace-pre-wrap text-sm">{note.content}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {author?.full_name ?? 'Alguém'} · {formatRelativeTime(note.created_at)}
                </span>
                <button onClick={() => deleteNote.mutate(note.id)} className="hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
