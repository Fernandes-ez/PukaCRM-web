import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2, Mic } from 'lucide-react'
import { conversationService } from '@/services/conversationService'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface AudioMessagePlayerProps {
  conversationId: string
  messageId: string
}

/**
 * Busca o áudio sob demanda (só ao clicar) via blob autenticado — a Meta
 * exige o access_token até pra baixar o arquivo, então não dá pra apontar
 * um <audio src> direto pra lá nem pro nosso endpoint sem o header
 * Authorization, que uma tag HTML nativa não manda. O botão usa
 * `currentColor` (border-current/bg-current) pra se adaptar tanto à bolha
 * clara (Lead) quanto à escura (IA/funcionário) sem precisar de variant.
 */
export function AudioMessagePlayer({ conversationId, messageId }: AudioMessagePlayerProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function handlePlay() {
    if (audioUrl) {
      audioRef.current?.play()
      return
    }
    setStatus('loading')
    try {
      const blob = await conversationService.getAudio(conversationId, messageId)
      setAudioUrl(URL.createObjectURL(blob))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'error') {
    return (
      <div className="mb-1 flex items-center gap-1.5 text-xs opacity-90">
        <AlertCircle className="h-3.5 w-3.5" />
        Áudio indisponível
      </div>
    )
  }

  if (audioUrl) {
    return (
      <audio
        ref={audioRef}
        controls
        autoPlay
        src={audioUrl}
        className="mb-1 h-8 w-56 max-w-full"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={status === 'loading'}
      className="mb-1 inline-flex items-center gap-1.5 rounded-md border border-current/25 bg-current/10 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-current/20 disabled:pointer-events-none disabled:opacity-70"
    >
      {status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
      Ouvir áudio
    </button>
  )
}
