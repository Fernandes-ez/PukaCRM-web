import type { Lead } from '@/types/lead'
import {
  MESSAGE_TEMPLATE_VARIABLE_SOURCES,
  MESSAGE_TEMPLATE_VARIABLE_TOKEN,
  type MessageTemplate,
  type MessageTemplateButton,
  type MessageTemplateVariableSource,
} from '@/types/messageTemplate'

export interface TemplatePreviewContext {
  lead: Lead
  employeeName?: string | null
  companyName?: string | null
}

/**
 * Mesma resolução que o backend faz de verdade no envio
 * (`ConversationService._resolve_variable_values`) - aqui é só pra
 * pré-visualização, o valor real é sempre resolvido de novo no servidor.
 */
function resolveVariableValue(source: MessageTemplateVariableSource, ctx: TemplatePreviewContext): string {
  switch (source) {
    case 'LEAD_NAME':
      return ctx.lead.full_name || ctx.lead.phone
    case 'LEAD_PHONE':
      return ctx.lead.phone
    case 'EMPLOYEE_NAME':
      return ctx.employeeName ?? ''
    case 'COMPANY_NAME':
      return ctx.companyName ?? ''
  }
}

function substituteAllTokens(text: string, ctx: TemplatePreviewContext): string {
  let result = text
  for (const source of MESSAGE_TEMPLATE_VARIABLE_SOURCES) {
    result = result.replaceAll(`{{${MESSAGE_TEMPLATE_VARIABLE_TOKEN[source]}}}`, resolveVariableValue(source, ctx))
  }
  return result
}

/**
 * Renderiza corpo + botões de um template pro Lead selecionado - usado
 * pelos diálogos de "iniciar conversa" (1 lead e em lote) pra mostrar
 * como a mensagem vai chegar de verdade, incluindo a URL dinâmica de um
 * botão quando existir. Nunca é o que é enviado - o backend resolve de
 * novo, com os dados mais atuais, na hora de enviar.
 */
export function renderTemplatePreview(
  template: MessageTemplate,
  ctx: TemplatePreviewContext,
): { bodyText: string; buttons: MessageTemplateButton[] } {
  const bodyText = substituteAllTokens(template.body_text, ctx)
  const buttons = template.buttons.map((button) =>
    button.type === 'URL' && button.url ? { ...button, url: substituteAllTokens(button.url, ctx) } : button,
  )
  return { bodyText, buttons }
}
