import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, MessageSquare } from 'lucide-react'
import { useConversation, useConversations } from '@/hooks/useConversations'
import { useLeads } from '@/hooks/useLeads'
import { cn } from '@/utils/cn'
import { compareDatesDesc } from '@/utils/date'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationDetail } from '@/pages/conversations/ConversationDetail'
import { CopilotPanel } from '@/pages/conversations/CopilotPanel'
import type { ConversationStatus } from '@/types/conversation'

const statusLabel: Record<ConversationStatus, string> = {
  OPEN: 'Aberta',
  PENDING: 'Pendente',
  CLOSED: 'Fechada',
}

function relativeTime(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  return `${Math.round(diffH / 24)}d`
}

export function ConversationsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: conversations, isLoading } = useConversations()
  const { data: leads } = useLeads()
  const { data: activeConversation } = useConversation(id)
  const [draftMessage, setDraftMessage] = useState('')

  const leadNameById = new Map((leads ?? []).map((lead) => [lead.id, lead.full_name]))

  return (
    <div className="flex h-[calc(100vh-6.5rem)] gap-4">
      <div className="flex w-full max-w-xs shrink-0 flex-col rounded-lg border bg-card">
        <div className="border-b p-4">
          <h1 className="text-lg font-semibold tracking-tight">Conversas</h1>
          <p className="text-xs text-muted-foreground">{conversations?.length ?? 0} no total</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : conversations?.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
          ) : (
            conversations
              ?.slice()
              .sort((a, b) => compareDatesDesc(a.last_message_at ?? a.created_at, b.last_message_at ?? b.created_at))
              .map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => navigate(`/conversations/${conversation.id}`)}
                  className={cn(
                    'flex w-full flex-col gap-1 border-b px-4 py-3 text-left text-sm transition-colors hover:bg-accent',
                    id === conversation.id && 'bg-accent',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{leadNameById.get(conversation.lead_id) ?? 'Lead sem nome'}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTime(conversation.last_message_at ?? conversation.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {conversation.needs_human_attention && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Atenção
                      </Badge>
                    )}
                    <Badge variant="outline">{statusLabel[conversation.status]}</Badge>
                  </div>
                </button>
              ))
          )}
        </div>
      </div>

      <div className="flex-1 rounded-lg border bg-card">
        {id ? (
          <ConversationDetail
            conversationId={id}
            draftMessage={draftMessage}
            onDraftMessageConsumed={() => setDraftMessage('')}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageSquare className="h-8 w-8" />
            <p className="text-sm">Selecione uma conversa para visualizar</p>
          </div>
        )}
      </div>

      {id && activeConversation?.assigned_employee_id && (
        <CopilotPanel conversationId={id} onUseSuggestion={setDraftMessage} />
      )}
    </div>
  )
}
