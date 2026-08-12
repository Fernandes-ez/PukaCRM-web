import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Search, X, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/hooks/useCompany'
import { useMessageTemplates } from '@/hooks/useMessageTemplates'
import { useLeads, useStartConversationBulk } from '@/hooks/useLeads'
import { useConversations } from '@/hooks/useConversations'
import { ApiError } from '@/services/apiClient'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Lead, StartConversationBulkResult } from '@/types/lead'
import { MESSAGE_TEMPLATE_VARIABLE_TOKEN, type MessageTemplateVariableSource } from '@/types/messageTemplate'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

type Step = 'contacts' | 'template' | 'result'

interface StartConversationBulkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartConversationBulkDialog({ open, onOpenChange }: StartConversationBulkDialogProps) {
  const { data: leads, isLoading: leadsLoading } = useLeads()
  const { data: conversations } = useConversations()
  const { data: templates } = useMessageTemplates()
  const { employee } = useAuth()
  const { data: company } = useCompany()
  const startBulk = useStartConversationBulk()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('contacts')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [templateId, setTemplateId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [results, setResults] = useState<StartConversationBulkResult[]>([])

  // Quem já tem uma conversa aberta não faz sentido aparecer num picker de "iniciar conversa nova" -
  // essa pessoa já está na lista de Conversas, é só clicar nela.
  const leadIdsWithOpenConversation = useMemo(
    () => new Set((conversations ?? []).filter((c) => c.status === 'OPEN').map((c) => c.lead_id)),
    [conversations],
  )

  const candidates = useMemo(
    () => (leads ?? []).filter((lead) => lead.status === 'ACTIVE' && !leadIdsWithOpenConversation.has(lead.id)),
    [leads, leadIdsWithOpenConversation],
  )

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return candidates
    return candidates.filter(
      (lead) => lead.full_name?.toLowerCase().includes(query) || lead.phone.includes(query),
    )
  }, [candidates, search])

  const leadById = useMemo(() => new Map((leads ?? []).map((lead) => [lead.id, lead])), [leads])
  const selectedLeads = useMemo(
    () => Array.from(selectedIds).map((id) => leadById.get(id)).filter((lead): lead is Lead => !!lead),
    [selectedIds, leadById],
  )

  const approvedTemplates = useMemo(() => templates?.filter((t) => t.status === 'APPROVED') ?? [], [templates])
  const selectedTemplate = approvedTemplates.find((t) => t.id === templateId)

  function resolveVariableValue(source: MessageTemplateVariableSource, lead: Lead): string {
    switch (source) {
      case 'LEAD_NAME':
        return lead.full_name || lead.phone
      case 'LEAD_PHONE':
        return lead.phone
      case 'EMPLOYEE_NAME':
        return employee?.full_name ?? ''
      case 'COMPANY_NAME':
        return company?.name ?? ''
    }
  }

  const preview = useMemo(() => {
    if (!selectedTemplate || selectedLeads.length === 0) return ''
    let text = selectedTemplate.body_text
    for (const source of selectedTemplate.variables_used) {
      text = text.replaceAll(`{{${MESSAGE_TEMPLATE_VARIABLE_TOKEN[source]}}}`, resolveVariableValue(source, selectedLeads[0]))
    }
    return text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, selectedLeads, employee, company])

  function toggleLead(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    setSelectedIds((prev) => new Set([...prev, ...filteredCandidates.map((l) => l.id)]))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function reset() {
    setStep('contacts')
    setSearch('')
    setSelectedIds(new Set())
    setTemplateId('')
    setFormError(null)
    setResults([])
  }

  async function handleSend() {
    if (!templateId || selectedIds.size === 0) return
    setFormError(null)
    try {
      const response = await startBulk.mutateAsync({ lead_ids: Array.from(selectedIds), template_id: templateId })
      setResults(response.results)
      setStep('result')
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  const successCount = results.filter((r) => !r.error).length

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="max-w-lg">
        {step === 'contacts' && (
          <>
            <DialogHeader>
              <DialogTitle>Iniciar conversa</DialogTitle>
              <DialogDescription>Selecione um ou mais contatos para iniciar uma conversa nova.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou telefone"
                  className="pl-8"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{selectedIds.size} selecionado(s)</span>
                <div className="flex gap-3">
                  <button type="button" className="hover:underline" onClick={selectAllVisible}>
                    Selecionar visíveis
                  </button>
                  {selectedIds.size > 0 && (
                    <button type="button" className="hover:underline" onClick={clearSelection}>
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              <div className="h-72 space-y-0.5 overflow-y-auto rounded-md border">
                {leadsLoading ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">Carregando contatos…</p>
                ) : filteredCandidates.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    {candidates.length === 0
                      ? 'Todos os contatos já têm uma conversa em aberto.'
                      : 'Nenhum contato encontrado.'}
                  </p>
                ) : (
                  filteredCandidates.map((lead) => (
                    <label
                      key={lead.id}
                      htmlFor={`contact-${lead.id}`}
                      className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-accent"
                    >
                      <Checkbox
                        id={`contact-${lead.id}`}
                        checked={selectedIds.has(lead.id)}
                        onCheckedChange={() => toggleLead(lead.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{initials(lead.full_name || lead.phone)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{lead.full_name ?? 'Lead sem nome'}</p>
                        <p className="truncate text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={selectedIds.size === 0} onClick={() => setStep('template')}>
                Continuar {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'template' && (
          <>
            <DialogHeader>
              <DialogTitle>Escolher template</DialogTitle>
              <DialogDescription>
                Fora da janela de atendimento de 24h, só um Message Template aprovado pode iniciar contato.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {selectedLeads.map((lead) => (
                  <Badge key={lead.id} variant="outline" className="gap-1 pr-1">
                    {lead.full_name ?? lead.phone}
                    <button
                      type="button"
                      onClick={() => toggleLead(lead.id)}
                      className="rounded-full p-0.5 hover:bg-muted"
                      aria-label={`Remover ${lead.full_name ?? lead.phone}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              {approvedTemplates.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Nenhum template aprovado ainda. Cadastre um em WhatsApp → Templates de Mensagem e aguarde a
                    aprovação da Meta.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Template</Label>
                    <Select value={templateId} onValueChange={setTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um template aprovado" />
                      </SelectTrigger>
                      <SelectContent>
                        {approvedTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <div className="space-y-1.5">
                      <Label>Pré-visualização</Label>
                      <p className="whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm">{preview}</p>
                      {selectedLeads.length > 1 && (
                        <p className="text-xs text-muted-foreground">
                          Exemplo com {selectedLeads[0].full_name ?? selectedLeads[0].phone} — cada contato recebe a
                          mensagem personalizada com os próprios dados.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('contacts')}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button type="button" disabled={!templateId || startBulk.isPending} onClick={handleSend}>
                {startBulk.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar para {selectedIds.size} contato(s)
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'result' && (
          <>
            <DialogHeader>
              <DialogTitle>Conversas iniciadas</DialogTitle>
              <DialogDescription>
                {successCount} de {results.length} enviada(s) com sucesso.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-72 space-y-0.5 overflow-y-auto rounded-md border">
              {results.map((result) => {
                const lead = leadById.get(result.lead_id)
                const ok = !result.error
                return (
                  <button
                    key={result.lead_id}
                    type="button"
                    disabled={!ok}
                    onClick={() => {
                      if (ok && result.conversation_id) {
                        onOpenChange(false)
                        navigate(`/conversations/${result.conversation_id}`)
                      }
                    }}
                    className="flex w-full items-center gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 enabled:hover:bg-accent disabled:cursor-default"
                  >
                    {ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{lead?.full_name ?? lead?.phone ?? 'Contato'}</p>
                      {result.error && <p className="truncate text-xs text-destructive">{result.error}</p>}
                    </div>
                  </button>
                )
              })}
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Concluir
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
