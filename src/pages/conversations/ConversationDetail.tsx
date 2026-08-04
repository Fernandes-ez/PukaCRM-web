import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, UserPlus, Loader2, Clock, Bot } from 'lucide-react'
import { useConversation, useMessages, useSendMessage } from '@/hooks/useConversations'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AssignConversationDialog } from '@/pages/conversations/AssignConversationDialog'
import type { ConversationStatus } from '@/types/conversation'

const schema = z.object({ content: z.string().min(1) })
type FormValues = z.infer<typeof schema>

const statusLabel: Record<ConversationStatus, string> = {
  OPEN: 'Aberta',
  PENDING: 'Pendente',
  CLOSED: 'Fechada',
}

export function ConversationDetail({ conversationId }: { conversationId: string }) {
  const { data: conversation, isLoading: isLoadingConversation } = useConversation(conversationId)
  const { data: messages, isLoading: isLoadingMessages } = useMessages(conversationId)
  const sendMessage = useSendMessage(conversationId)
  const { toast } = useToast()
  const [assignOpen, setAssignOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  async function onSubmit(data: FormValues) {
    try {
      await sendMessage.mutateAsync(data)
      reset()
      toast({
        title: 'Mensagem registrada',
        description: 'O envio real pro WhatsApp ainda não está ativo — a mensagem fica pendente.',
      })
    } catch (error) {
      toast({
        title: 'Não foi possível enviar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  if (isLoadingConversation) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!conversation) return null

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-semibold">{conversation.lead_name ?? 'Lead sem nome'}</h2>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant="outline">{statusLabel[conversation.status]}</Badge>
            <span className="text-xs text-muted-foreground">
              {conversation.assigned_employee_name
                ? `Responsável: ${conversation.assigned_employee_name}`
                : 'Sem responsável'}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Atribuir
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoadingMessages ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-2/3" />
            ))}
          </div>
        ) : messages?.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        ) : (
          messages?.map((message) => {
            const isFromLead = message.sender_type === 'LEAD'
            return (
              <div key={message.id} className={cn('flex', isFromLead ? 'justify-start' : 'justify-end')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                    isFromLead ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground',
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div
                    className={cn(
                      'mt-1 flex items-center gap-1 text-[10px] opacity-70',
                      isFromLead ? '' : 'justify-end',
                    )}
                  >
                    {message.status === 'PENDING' && <Clock className="h-3 w-3" />}
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {message.sender_type === 'AI' && (
                      <span className="flex items-center gap-0.5">
                        <Bot className="h-3 w-3" />
                        IA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2 border-t p-3">
        <Textarea
          placeholder="Escreva uma mensagem..."
          rows={1}
          className="min-h-9 flex-1 resize-none"
          {...register('content')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(onSubmit)()
            }
          }}
        />
        <Button type="submit" size="icon" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      <AssignConversationDialog conversation={conversation} open={assignOpen} onOpenChange={setAssignOpen} />
    </div>
  )
}
