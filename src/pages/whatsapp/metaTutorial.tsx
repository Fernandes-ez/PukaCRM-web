import { ExternalLink } from 'lucide-react'

/** Guia oficial da Meta — mostra como pegar o Phone Number ID e gerar o token de acesso. */
export const META_TUTORIAL_URL = 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started'

export function MetaTutorialLink({ className }: { className?: string }) {
  return (
    <a
      href={META_TUTORIAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline ${className ?? ''}`}
    >
      <ExternalLink className="h-3 w-3" />
      Tutorial da Meta: como conseguir esses valores
    </a>
  )
}
