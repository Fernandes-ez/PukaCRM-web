import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/hooks/useCompany'
import { useMessageTemplates } from '@/hooks/useMessageTemplates'
import { useStartConversation } from '@/hooks/useLeads'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageTemplateButtonsPreview } from '@/components/message-template-buttons-preview'
import type { Lead } from '@/types/lead'
import { formatPhone } from '@/utils/phone'
import { renderTemplatePreview } from '@/utils/messageTemplatePreview'

interface StartConversationDialogProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartConversationDialog({ lead, open, onOpenChange }: StartConversationDialogProps) {
  const { data: templates } = useMessageTemplates()
  const { employee } = useAuth()
  const { data: company } = useCompany()
  const startConversation = useStartConversation()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [templateId, setTemplateId] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  const approvedTemplates = useMemo(() => templates?.filter((t) => t.status === 'APPROVED') ?? [], [templates])
  const selectedTemplate = approvedTemplates.find((t) => t.id === templateId)

  // Pré-visualização só - o backend resolve de novo, com os dados mais
  // atuais, na hora de enviar de verdade.
  const preview = useMemo(() => {
    if (!selectedTemplate) return null
    return renderTemplatePreview(selectedTemplate, {
      lead,
      employeeName: employee?.full_name,
      companyName: company?.name,
    })
  }, [selectedTemplate, lead, employee, company])

  async function handleSend() {
    if (!templateId) return
    setFormError(null)
    try {
      const conversation = await startConversation.mutateAsync({ id: lead.id, payload: { template_id: templateId } })
      toast({ title: 'Conversa iniciada', variant: 'success' })
      onOpenChange(false)
      navigate(`/conversations/${conversation.id}`)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setTemplateId('')
          setFormError(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar conversa com {lead.full_name ?? formatPhone(lead.phone)}</DialogTitle>
          <DialogDescription>
            Fora da janela de atendimento de 24h, só um Message Template aprovado pode iniciar contato.
          </DialogDescription>
        </DialogHeader>

        {approvedTemplates.length === 0 ? (
          <Alert>
            <AlertDescription>
              Nenhum template aprovado ainda. Cadastre um em WhatsApp → Templates de Mensagem e aguarde a
              aprovação da Meta.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
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

            {preview && (
              <div className="space-y-1.5">
                <Label>Pré-visualização</Label>
                <p className="whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm">{preview.bodyText}</p>
                <MessageTemplateButtonsPreview buttons={preview.buttons} />
              </div>
            )}

            <DialogFooter>
              <Button type="button" disabled={!templateId || startConversation.isPending} onClick={handleSend}>
                {startConversation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
