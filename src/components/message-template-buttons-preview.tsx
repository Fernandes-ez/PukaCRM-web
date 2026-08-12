import { ExternalLink, MessageSquare, Phone } from 'lucide-react'
import type { MessageTemplateButton } from '@/types/messageTemplate'

const ICON: Record<MessageTemplateButton['type'], typeof MessageSquare> = {
  QUICK_REPLY: MessageSquare,
  URL: ExternalLink,
  PHONE_NUMBER: Phone,
}

/** Mockup somente-leitura dos botões, na mesma pinta de como aparecem de verdade no WhatsApp - linhas cheias, empilhadas. */
export function MessageTemplateButtonsPreview({ buttons }: { buttons: MessageTemplateButton[] }) {
  if (buttons.length === 0) return null

  return (
    <div className="overflow-hidden rounded-md border">
      {buttons.map((button, index) => {
        const Icon = ICON[button.type]
        return (
          <div
            key={index}
            className="flex items-center justify-center gap-2 border-t px-3 py-2 text-sm text-primary first:border-t-0"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="truncate">{button.text}</span>
          </div>
        )
      })}
    </div>
  )
}
