import { Sparkles, Wand2 } from 'lucide-react'
import { useCopilotSuggestion, useMarkCopilotSuggestionUsed } from '@/hooks/useCopilotSuggestion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface CopilotPanelProps {
  conversationId: string
  onUseSuggestion: (text: string) => void
}

/**
 * Assiste o consultor, nunca o Lead - fica ao lado do chat, não dentro dele.
 * Só existe quando um humano já assumiu a conversa (ConversationsPage só
 * renderiza isso com `assigned_employee_id` preenchido). 100% automático -
 * sem botão de pedir sugestão (decisão do usuário) - o pré-filtro do
 * backend detecta a objeção sozinho e a sugestão chega por push do
 * WebSocket em tempo real, com um `GET` de fallback ao abrir o painel
 * pro caso do push ter sido perdido (ver hooks/useCopilotSuggestion.ts).
 */
export function CopilotPanel({ conversationId, onUseSuggestion }: CopilotPanelProps) {
  const { data: suggestion, isLoading } = useCopilotSuggestion(conversationId)
  const markUsed = useMarkCopilotSuggestionUsed(conversationId)

  function handleUse() {
    if (!suggestion) return
    onUseSuggestion(suggestion.suggestion_text)
    if (!suggestion.used) {
      markUsed.mutate(suggestion.id)
    }
  }

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <h2 className="font-semibold">Puka Copilot</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Só você vê isso - o Lead nunca recebe nada daqui automaticamente.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : suggestion ? (
          <div className="space-y-3">
            {suggestion.objection_summary && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Objeção identificada</p>
                <p className="text-sm">{suggestion.objection_summary}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Sugestão</p>
              <p className="whitespace-pre-wrap text-sm">{suggestion.suggestion_text}</p>
            </div>

            <Button size="sm" className="w-full" onClick={handleUse}>
              <Wand2 className="h-4 w-4" />
              Usar esta sugestão
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem sugestão no momento - o copiloto avisa sozinho aqui quando identificar uma objeção na conversa.
          </p>
        )}
      </div>
    </div>
  )
}
