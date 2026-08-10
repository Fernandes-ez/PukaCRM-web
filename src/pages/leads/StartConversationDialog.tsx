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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Lead } from '@/types/lead'
import { variableLabelOrFallback, type MessageTemplateVariableSource } from '@/types/messageTemplate'

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
  const [variables, setVariables] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const approvedTemplates = useMemo(() => templates?.filter((t) => t.status === 'APPROVED') ?? [], [templates])
  const selectedTemplate = approvedTemplates.find((t) => t.id === templateId)

  // Fontes conhecidas já preenchem sozinhas com dado que o CRM já tem -
  // continua editável, só poupa digitar de novo o que já existe. CUSTOM
  // (ou fonte desconhecida, ex: template antigo sem esse metadado) fica vazio.
  function resolveVariableValue(source: MessageTemplateVariableSource | undefined): string {
    switch (source) {
      case 'LEAD_NAME':
        return lead.full_name ?? ''
      case 'LEAD_PHONE':
        return lead.phone ?? ''
      case 'EMPLOYEE_NAME':
        return employee?.full_name ?? ''
      case 'COMPANY_NAME':
        return company?.name ?? ''
      default:
        return ''
    }
  }

  function handleSelectTemplate(id: string) {
    setTemplateId(id)
    const template = approvedTemplates.find((t) => t.id === id)
    const count = template?.body_variable_count ?? 0
    setVariables(Array.from({ length: count }, (_, index) => resolveVariableValue(template?.variables?.[index]?.source)))
  }

  const preview = useMemo(() => {
    if (!selectedTemplate) return ''
    return variables.reduce<string>(
      (text, value, index) => text.replaceAll(`{{${index + 1}}}`, value || `{{${index + 1}}}`),
      selectedTemplate.body_text,
    )
  }, [selectedTemplate, variables])

  async function handleSend() {
    if (!templateId) return
    setFormError(null)
    try {
      const conversation = await startConversation.mutateAsync({ id: lead.id, payload: { template_id: templateId, variables } })
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
          setVariables([])
          setFormError(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar conversa com {lead.full_name ?? lead.phone}</DialogTitle>
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
              <Select value={templateId} onValueChange={handleSelectTemplate}>
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
              <>
                {variables.map((value, index) => (
                  <div key={index} className="space-y-1.5">
                    <Label htmlFor={`variable_${index}`}>
                      {variableLabelOrFallback(selectedTemplate.variables, index)}
                    </Label>
                    <Input
                      id={`variable_${index}`}
                      value={value}
                      onChange={(e) =>
                        setVariables((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))
                      }
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label>Pré-visualização</Label>
                  <p className="whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm">{preview}</p>
                </div>
              </>
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
