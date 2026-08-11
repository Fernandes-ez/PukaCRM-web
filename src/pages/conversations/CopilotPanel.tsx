import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import {
  useCopilotSuggestion,
  useMarkCopilotSuggestionUsed,
  useRequestCopilotSuggestion,
} from '@/hooks/useCopilotSuggestion'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CopilotPanelProps {
  conversationId: string
  onUseSuggestion: (text: string) => void
}

/**
 * Assiste o consultor, nunca o Lead - fica ao lado do chat, não dentro dele.
 * Só existe quando um humano já assumiu a conversa (ConversationsPage só
 * renderiza isso com `assigned_employee_id` preenchido). Sugestão chega por
 * dois caminhos que convergem no mesmo slot de cache (ver
 * hooks/useCopilotSuggestion.ts): pedido sob demanda (botão abaixo) ou push
 * automático via WebSocket quando o pré-filtro detecta objeção sozinho.
 */
export function CopilotPanel({ conversationId, onUseSuggestion }: CopilotPanelProps) {
  const { data: suggestion } = useCopilotSuggestion(conversationId)
  const requestSuggestion = useRequestCopilotSuggestion(conversationId)
  const markUsed = useMarkCopilotSuggestionUsed(conversationId)
  const { toast } = useToast()

  async function handleRequest() {
    try {
      await requestSuggestion.mutateAsync()
    } catch (error) {
      toast({
        title: 'Não foi possível gerar uma sugestão',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

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
          <h2 className="font-semibold">Copiloto de negociação</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Só você vê isso - o Lead nunca recebe nada daqui automaticamente.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {suggestion ? (
          <div className="space-y-3">
            <Badge variant="outline">
              {suggestion.source === 'AUTOMATIC' ? 'Detectado automaticamente' : 'Gerado a pedido'}
            </Badge>

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
            Peça uma sugestão quando o Lead trouxer uma objeção, ou aguarde - o copiloto avisa sozinho quando
            identificar algo na conversa.
          </p>
        )}
      </div>

      <div className="border-t p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleRequest}
          disabled={requestSuggestion.isPending}
        >
          {requestSuggestion.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Sugerir resposta
        </Button>
      </div>
    </div>
  )
}
