import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAssignConversation, useAssignableEmployees } from '@/hooks/useConversations'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import type { ConversationRead } from '@/types/conversation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AssignConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversation: ConversationRead
}

export function AssignConversationDialog({ open, onOpenChange, conversation }: AssignConversationDialogProps) {
  const { data: employees } = useAssignableEmployees()
  const assignConversation = useAssignConversation()
  const { toast } = useToast()
  const [employeeId, setEmployeeId] = useState(conversation.assigned_employee_id ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleAssign() {
    if (!employeeId) return
    setFormError(null)
    try {
      await assignConversation.mutateAsync({ id: conversation.id, payload: { employee_id: employeeId } })
      toast({ title: 'Conversa atribuída', variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  // O backend já devolve só ativos (GET /conversations/assignable-employees).
  const activeEmployees = employees ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir conversa</DialogTitle>
          <DialogDescription>{conversation.lead_full_name ?? 'Lead sem nome'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="assign_conversation_employee">Funcionário</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger id="assign_conversation_employee">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleAssign} disabled={!employeeId || assignConversation.isPending}>
            {assignConversation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Atribuir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
