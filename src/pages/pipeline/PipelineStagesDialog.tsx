import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Loader2, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/services/apiClient'
import {
  usePipeline,
  useCreatePipelineStage,
  useDeletePipelineStage,
  useReorderPipelineStages,
} from '@/hooks/usePipeline'
import type { PipelineStage } from '@/types/pipeline'

interface PipelineStagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PipelineStagesDialog({ open, onOpenChange }: PipelineStagesDialogProps) {
  const { data: pipeline } = usePipeline()
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [newStageName, setNewStageName] = useState('')
  const createStage = useCreatePipelineStage()
  const deleteStage = useDeletePipelineStage()
  const reorderStages = useReorderPipelineStages()
  const { toast } = useToast()

  useEffect(() => {
    if (pipeline) setStages(pipeline.stages)
  }, [pipeline])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(stages, oldIndex, newIndex)
    setStages(reordered)

    try {
      await reorderStages.mutateAsync({ stage_ids: reordered.map((s) => s.id) })
    } catch (error) {
      setStages(pipeline?.stages ?? [])
      toast({
        title: 'Não foi possível reordenar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleCreate() {
    if (!newStageName.trim()) return
    try {
      await createStage.mutateAsync({ name: newStageName.trim() })
      setNewStageName('')
    } catch (error) {
      toast({
        title: 'Não foi possível criar o estágio',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(stageId: string) {
    try {
      await deleteStage.mutateAsync(stageId)
    } catch (error) {
      toast({
        title: 'Não foi possível excluir o estágio',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar estágios</DialogTitle>
          <DialogDescription>Arraste pra reordenar. Excluir só é possível sem leads no estágio.</DialogDescription>
        </DialogHeader>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {stages.map((stage) => (
                <StageRow key={stage.id} stage={stage} onDelete={() => handleDelete(stage.id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2 border-t pt-3">
          <Input
            placeholder="Nome do novo estágio"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button type="button" size="sm" onClick={handleCreate} disabled={!newStageName.trim() || createStage.isPending}>
            {createStage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StageRow({ stage, onDelete }: { stage: PipelineStage; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm">{stage.name}</span>
      {stage.is_won && <span className="text-xs text-success">Ganho</span>}
      {stage.is_lost && <span className="text-xs text-destructive">Perdido</span>}
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
