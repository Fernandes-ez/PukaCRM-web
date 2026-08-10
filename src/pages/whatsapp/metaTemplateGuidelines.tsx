import { ExternalLink } from 'lucide-react'

/** Doc oficial da Meta sobre criação/aprovação de Message Templates. */
export const META_TEMPLATE_GUIDELINES_URL = 'https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview'

export function MetaTemplateGuidelinesLink({ className }: { className?: string }) {
  return (
    <a
      href={META_TEMPLATE_GUIDELINES_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline ${className ?? ''}`}
    >
      <ExternalLink className="h-3 w-3" />
      Documentação oficial da Meta sobre templates
    </a>
  )
}
