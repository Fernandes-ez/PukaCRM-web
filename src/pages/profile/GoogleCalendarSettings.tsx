import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useConnectGoogleCalendar, useDisconnectGoogleCalendar, useGoogleCalendarStatus } from '@/hooks/useGoogleCalendar'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Conteúdo de conexão com o Google Calendar - sem Dialog/Tabs em volta,
 * reaproveitado tanto pela aba "Google Calendar" de `ProfileSettingsDialog`
 * (acessada por "Meu perfil") quanto por `GoogleCalendarDialog` (acessado
 * pelo botão da Agenda, direto, sem as outras abas de perfil no meio).
 */
export function GoogleCalendarSettings() {
  const { data: connection, isLoading } = useGoogleCalendarStatus()
  const connect = useConnectGoogleCalendar()
  const disconnect = useDisconnectGoogleCalendar()
  const { toast } = useToast()
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleConnect() {
    try {
      const { authorize_url } = await connect.mutateAsync()
      // Navegação de página inteira, não XHR - o próximo salto é o
      // consentimento do Google, não algo que a SPA consiga tratar em XHR.
      window.location.href = authorize_url
    } catch {
      toast({ title: 'Não foi possível iniciar a conexão com o Google Calendar', variant: 'destructive' })
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await disconnect.mutateAsync()
      toast({ title: 'Google Calendar desconectado', variant: 'success' })
    } catch {
      toast({ title: 'Não foi possível desconectar', variant: 'destructive' })
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Conecte sua conta do Google pra que seus agendamentos do Puka apareçam automaticamente na sua agenda pessoal.
        Só cria/atualiza/remove os eventos - nunca lê sua agenda de volta.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : connection ? (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="font-medium">
            Conectado{connection.google_account_email ? ` como ${connection.google_account_email}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            Desde{' '}
            {new Date(connection.connected_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma conta do Google conectada ainda.</p>
      )}

      <div className="flex justify-end">
        {connection ? (
          <Button type="button" variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting && <Loader2 className="h-4 w-4 animate-spin" />}
            Desconectar
          </Button>
        ) : (
          <Button type="button" onClick={handleConnect} disabled={connect.isPending}>
            {connect.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Conectar Google Calendar
          </Button>
        )}
      </div>
    </div>
  )
}
