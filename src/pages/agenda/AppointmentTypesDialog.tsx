import { useState } from 'react'
import { Loader2, Trash2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/services/apiClient'
import {
  useAppointmentTypes,
  useCreateAppointmentType,
  useDeleteAppointmentType,
} from '@/hooks/useAppointments'

interface AppointmentTypesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_COLOR = '#B105DB'

export function AppointmentTypesDialog({ open, onOpenChange }: AppointmentTypesDialogProps) {
  const { data: types, isLoading } = useAppointmentTypes()
  const createType = useCreateAppointmentType()
  const deleteType = useDeleteAppointmentType()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [duration, setDuration] = useState('30')
  const [color, setColor] = useState(DEFAULT_COLOR)

  async function handleCreate() {
    if (!name.trim()) return
    try {
      await createType.mutateAsync({ name: name.trim(), duration_minutes: Number(duration) || 30, color })
      setName('')
      setDuration('30')
      toast({ title: 'Tipo de agendamento criado', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Não foi possível criar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteType.mutateAsync(id)
      toast({ title: 'Tipo de agendamento excluído', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Não foi possível excluir',
        description: error instanceof ApiError ? error.message : 'Esse tipo tem agendamentos vinculados.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tipos de agendamento</DialogTitle>
          <DialogDescription>Serviços que podem ser marcados na Agenda, cada um com sua duração.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {types?.map((type) => (
              <div key={type.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: type.color ?? DEFAULT_COLOR }} />
                  <strong>{type.name}</strong>
                  <span className="text-muted-foreground">{type.duration_minutes}min</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(type.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Excluir ${type.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="grid grid-cols-[1fr_90px_44px] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="type_name">Nome</Label>
              <Input id="type_name" placeholder="Ex: Avaliação física" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type_duration">Minutos</Label>
              <Input id="type_duration" type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type_color">Cor</Label>
              <input
                id="type_color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-full cursor-pointer rounded-md border border-input"
              />
            </div>
          </div>
          <Button type="button" size="sm" className="w-full" onClick={handleCreate} disabled={!name.trim() || createType.isPending}>
            {createType.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Adicionar tipo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
