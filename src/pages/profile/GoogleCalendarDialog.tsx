import { useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import { useConnectGoogleCalendar, useDisconnectGoogleCalendar, useGoogleCalendarStatus } from '@/hooks/useGoogleCalendar'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface GoogleCalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GoogleCalendarDialog({ open, onOpenChange }: GoogleCalendarDialogProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Google Calendar
          </DialogTitle>
          <DialogDescription>
            Conecte sua conta do Google pra que seus agendamentos do Puka apareçam automaticamente na sua agenda
            pessoal. Só cria/atualiza/remove os eventos - nunca lê sua agenda de volta.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : connection ? (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Conectado{connection.google_account_email ? ` como ${connection.google_account_email}` : ''}</p>
            <p className="text-xs text-muted-foreground">
              Desde {new Date(connection.connected_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma conta do Google conectada ainda.</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
