import type { Employee } from '@/types/employee'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { WorkScheduleEditor } from '@/pages/employees/WorkScheduleEditor'

interface WorkSchedulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee
}

export function WorkSchedulesDialog({ open, onOpenChange, employee }: WorkSchedulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Horários de trabalho</DialogTitle>
          <DialogDescription>{employee.full_name}</DialogDescription>
        </DialogHeader>
        <WorkScheduleEditor employee={employee} />
      </DialogContent>
    </Dialog>
  )
}
