import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Settings } from 'lucide-react'
import { usePipeline } from '@/hooks/usePipeline'
import { useLeads, useMoveLeadStage } from '@/hooks/useLeads'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import { PipelineStagesDialog } from '@/pages/pipeline/PipelineStagesDialog'
import { LeadDetailDialog } from '@/pages/pipeline/LeadDetailDialog'
import type { Lead } from '@/types/lead'

const NO_STAGE_COLUMN = '__none__'

export function PipelinePage() {
  const { data: pipeline, isLoading: isLoadingPipeline } = usePipeline()
  const { data: leads, isLoading: isLoadingLeads } = useLeads()
  const moveLeadStage = useMoveLeadStage()
  const { hasPermission } = useAuth()
  const { toast } = useToast()

  const [stagesDialogOpen, setStagesDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const canManage = hasPermission('PIPELINE', 'pipeline', 'MANAGE')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const activeLeads = useMemo(() => (leads ?? []).filter((l) => l.status === 'ACTIVE'), [leads])

  const leadsByStage = useMemo(() => {
    const map = new Map<string, Lead[]>()
    for (const lead of activeLeads) {
      const key = lead.pipeline_stage_id ?? NO_STAGE_COLUMN
      map.set(key, [...(map.get(key) ?? []), lead])
    }
    return map
  }, [activeLeads])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || over.id === NO_STAGE_COLUMN) return
    const lead = activeLeads.find((l) => l.id === active.id)
    if (!lead || lead.pipeline_stage_id === over.id) return

    try {
      await moveLeadStage.mutateAsync({ id: lead.id, pipelineStageId: over.id as string })
    } catch (error) {
      toast({
        title: 'Não foi possível mover o lead',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  if (isLoadingPipeline || isLoadingLeads) {
    return (
      <div className="flex gap-4 overflow-x-auto p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-72 shrink-0" />
        ))}
      </div>
    )
  }

  const noStageLeads = leadsByStage.get(NO_STAGE_COLUMN) ?? []

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pipeline</h1>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => setStagesDialogOpen(true)}>
            <Settings className="h-4 w-4" />
            Configurar estágios
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
          {pipeline?.stages.map((stage) => (
            <PipelineColumn
              key={stage.id}
              id={stage.id}
              title={stage.name}
              isWon={stage.is_won}
              isLost={stage.is_lost}
              leads={leadsByStage.get(stage.id) ?? []}
              onSelectLead={setSelectedLead}
            />
          ))}
          {noStageLeads.length > 0 && (
            <PipelineColumn
              id={NO_STAGE_COLUMN}
              title="Sem estágio"
              leads={noStageLeads}
              onSelectLead={setSelectedLead}
              droppable={false}
            />
          )}
        </div>
      </DndContext>

      <PipelineStagesDialog open={stagesDialogOpen} onOpenChange={setStagesDialogOpen} />
      {selectedLead && (
        <LeadDetailDialog lead={selectedLead} open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)} />
      )}
    </div>
  )
}

interface PipelineColumnProps {
  id: string
  title: string
  leads: Lead[]
  isWon?: boolean
  isLost?: boolean
  droppable?: boolean
  onSelectLead: (lead: Lead) => void
}

function PipelineColumn({ id, title, leads, isWon, isLost, droppable = true, onSelectLead }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors',
        isOver && droppable && 'border-brand-500 bg-brand-50 dark:bg-brand-950/30',
      )}
    >
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{title}</span>
          {isWon && <Badge variant="success">Ganho</Badge>}
          {isLost && <Badge variant="destructive">Perdido</Badge>}
        </div>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onSelect={() => onSelectLead(lead)} />
        ))}
      </div>
    </div>
  )
}

function LeadCard({ lead, onSelect }: { lead: Lead; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={cn(
        'cursor-grab rounded-md border bg-card p-2.5 shadow-sm active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
    >
      <p className="text-sm font-medium">{lead.full_name ?? 'Lead sem nome'}</p>
      <p className="text-xs text-muted-foreground">{lead.phone}</p>
    </div>
  )
}
