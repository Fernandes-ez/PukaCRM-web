import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, UserPlus, UserX, CircleCheck, Loader2, Clock, Bot } from 'lucide-react'
import {
  useConversation,
  useMessages,
  useSendMessage,
  useUnassignConversation,
  useCloseConversation,
} from '@/hooks/useConversations'
import { useEmployees } from '@/hooks/useEmployees'
import { useBillingGate } from '@/hooks/useBillingGate'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AssignConversationDialog } from '@/pages/conversations/AssignConversationDialog'
import { AudioMessagePlayer } from '@/pages/conversations/AudioMessagePlayer'
import type { ConversationStatus } from '@/types/conversation'

const schema = z.object({ content: z.string().min(1) })
type FormValues = z.infer<typeof schema>

const statusLabel: Record<ConversationStatus, string> = {
  OPEN: 'Aberta',
  PENDING: 'Pendente',
  CLOSED: 'Fechada',
}

interface ConversationDetailProps {
  conversationId: string
  /** Texto vindo do CopilotPanel ("Usar esta sugestão") - preenche o campo de resposta pro consultor revisar/editar antes de mandar. */
  draftMessage?: string
  onDraftMessageConsumed?: () => void
}

export function ConversationDetail({ conversationId, draftMessage, onDraftMessageConsumed }: ConversationDetailProps) {
  const { data: conversation, isLoading: isLoadingConversation } = useConversation(conversationId)
  const { data: messages, isLoading: isLoadingMessages } = useMessages(conversationId)
  const { data: employees } = useEmployees()
  const { employee: currentEmployee, hasPermission } = useAuth()
  const { blockedForMessaging, reason: billingBlockedReason } = useBillingGate()
  const sendMessage = useSendMessage(conversationId)
  const unassignConversation = useUnassignConversation()
  const closeConversation = useCloseConversation()
  const { toast } = useToast()
  const [assignOpen, setAssignOpen] = useState(false)
  const [unassignOpen, setUnassignOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  useEffect(() => {
    if (!draftMessage) return
    setValue('content', draftMessage)
    onDraftMessageConsumed?.()
  }, [draftMessage, setValue, onDraftMessageConsumed])

  async function onSubmit(data: FormValues) {
    try {
      await sendMessage.mutateAsync(data)
      reset()
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

  async function handleUnassign() {
    try {
      await unassignConversation.mutateAsync(conversationId)
      setUnassignOpen(false)
      toast({ title: 'Conversa devolvida pra IA' })
    } catch (error) {
      toast({
        title: 'Não foi possível devolver a conversa',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleClose() {
    try {
      await closeConversation.mutateAsync(conversationId)
      setCloseOpen(false)
      toast({ title: 'Conversa fechada' })
    } catch (error) {
      toast({
        title: 'Não foi possível fechar a conversa',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const isClosed = conversation.status === 'CLOSED'
  const assignedEmployeeName = employees?.find((employee) => employee.id === conversation.assigned_employee_id)
    ?.full_name
  // Só quem está com a conversa responde - nem o Owner passa por cima de
  // quem está atendendo (backend também trava isso, ver ConversationService.reply).
  const isAssignedToMe = !!currentEmployee && conversation.assigned_employee_id === currentEmployee.id

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-semibold">{conversation.lead_full_name ?? 'Lead sem nome'}</h2>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant="outline">{statusLabel[conversation.status]}</Badge>
            <span className="text-xs text-muted-foreground">
              {assignedEmployeeName ? `Responsável: ${assignedEmployeeName}` : 'Sem responsável'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.assigned_employee_id && (
            <Button variant="outline" size="sm" onClick={() => setUnassignOpen(true)}>
              <UserX className="h-4 w-4" />
              Devolver pra IA
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Atribuir
          </Button>
          {!isClosed && (
            <Button variant="outline" size="sm" onClick={() => setCloseOpen(true)}>
              <CircleCheck className="h-4 w-4" />
              Fechar conversa
            </Button>
          )}
        </div>
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
            if (message.sender_type === 'SYSTEM') {
              return (
                <div key={message.id} className="flex justify-center">
                  <p className="max-w-[85%] rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
                    {message.content}
                  </p>
                </div>
              )
            }
            const isFromLead = message.sender_type === 'LEAD'
            return (
              <div key={message.id} className={cn('flex', isFromLead ? 'justify-start' : 'justify-end')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                    isFromLead ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground',
                  )}
                >
                  {message.content_type === 'AUDIO' && (
                    <AudioMessagePlayer conversationId={conversationId} messageId={message.id} />
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div
                    className={cn(
                      'mt-1 flex items-center gap-1 text-[10px] opacity-90',
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

      {isClosed ? (
        <div className="border-t p-3 text-center text-sm text-muted-foreground">
          Conversa fechada — envie uma mensagem nova pelo WhatsApp do Lead pra abrir outra.
        </div>
      ) : !isAssignedToMe ? (
        <div className="border-t p-3 text-center text-sm text-muted-foreground">
          {conversation.assigned_employee_id
            ? `Esta conversa está com ${assignedEmployeeName ?? 'outro atendente'} — só quem está atribuído pode responder.`
            : 'A IA está respondendo essa conversa — clique em "Atribuir" pra assumir e poder responder.'}
        </div>
      ) : blockedForMessaging ? (
        <div className="border-t bg-destructive/10 p-3 text-center text-sm text-destructive">
          {billingBlockedReason}
          {hasPermission('SUBSCRIPTION', 'subscription', 'VIEW') && (
            <>
              {' '}
              <a href="/assinatura" className="underline underline-offset-2 hover:no-underline">
                Ver assinatura
              </a>
            </>
          )}
        </div>
      ) : (
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
      )}

      {assignOpen && (
        <AssignConversationDialog conversation={conversation} open={assignOpen} onOpenChange={setAssignOpen} />
      )}

      {unassignOpen && (
        <ConfirmDialog
          open={unassignOpen}
          onOpenChange={setUnassignOpen}
          title="Devolver conversa pra IA?"
          description="O responsável atual deixa de estar atribuído. A IA volta a responder automaticamente na próxima mensagem do Lead (se estiver ativa) — não gera uma resposta agora, só a partir da próxima mensagem."
          confirmLabel="Devolver pra IA"
          isPending={unassignConversation.isPending}
          onConfirm={handleUnassign}
        />
      )}

      {closeOpen && (
        <ConfirmDialog
          open={closeOpen}
          onOpenChange={setCloseOpen}
          title="Fechar esta conversa?"
          description="Não dá pra reabrir manualmente — se o Lead mandar outra mensagem depois, uma conversa nova é criada automaticamente."
          confirmLabel="Fechar conversa"
          isPending={closeConversation.isPending}
          onConfirm={handleClose}
        />
      )}
    </div>
  )
}
