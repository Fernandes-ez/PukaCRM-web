import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAssignLead } from '@/hooks/useLeads'
import { useEmployees } from '@/hooks/useEmployees'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import type { Lead } from '@/types/lead'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AssignLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
}

export function AssignLeadDialog({ open, onOpenChange, lead }: AssignLeadDialogProps) {
  const { data: employees } = useEmployees()
  const assignLead = useAssignLead()
  const { toast } = useToast()
  const [employeeId, setEmployeeId] = useState(lead.assigned_employee_id ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleAssign() {
    if (!employeeId) return
    setFormError(null)
    try {
      await assignLead.mutateAsync({ id: lead.id, payload: { employee_id: employeeId } })
      toast({ title: 'Responsável atribuído', variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  const activeEmployees = (employees ?? []).filter((e) => e.status === 'ACTIVE')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir responsável</DialogTitle>
          <DialogDescription>{lead.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="assign_employee">Funcionário</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger id="assign_employee">
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
          <Button type="button" onClick={handleAssign} disabled={!employeeId || assignLead.isPending}>
            {assignLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Atribuir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
