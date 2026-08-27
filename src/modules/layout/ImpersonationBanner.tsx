import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { setStoredToken } from '@/services/apiClient'

const IMPERSONATION_STORAGE_KEY = 'crm.impersonation'

interface ImpersonationMarker {
  company_name: string
  owner_name: string
  started_at: string
}

/**
 * Bookkeeping de UI, não é fronteira de segurança - mesmo raciocínio já
 * documentado em platformAdminClient.ts sobre separar chaves de
 * localStorage. Escrito pelo console de admin (CompanyDetailPage) antes do
 * reload completo pra dentro do app normal, lido aqui uma vez.
 */
export function readImpersonationMarker(): ImpersonationMarker | null {
  const raw = localStorage.getItem(IMPERSONATION_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ImpersonationMarker
  } catch {
    return null
  }
}

export function writeImpersonationMarker(marker: ImpersonationMarker) {
  localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(marker))
}

function clearImpersonationMarker() {
  localStorage.removeItem(IMPERSONATION_STORAGE_KEY)
}

/**
 * Faixa persistente e visível o tempo todo enquanto a sessão for
 * impersonada - segurança básica de UX pra quem está com acesso total de
 * Dono não confundir com a própria conta. Sem isso no estado (marcador
 * ausente), o componente não renderiza nada.
 */
export function ImpersonationBanner() {
  const [marker, setMarker] = useState<ImpersonationMarker | null>(null)

  useEffect(() => {
    setMarker(readImpersonationMarker())
  }, [])

  if (!marker) return null

  function handleExit() {
    setStoredToken(null)
    clearImpersonationMarker()
    window.location.href = '/platform-admin/companies'
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500/15 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:text-amber-300">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span>
        Você está acessando como <strong>{marker.owner_name}</strong> — {marker.company_name} (sessão de suporte)
      </span>
      <button type="button" onClick={handleExit} className="underline underline-offset-2 hover:no-underline">
        Sair
      </button>
    </div>
  )
}
