import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { GoogleCalendarSettings } from '@/pages/profile/GoogleCalendarSettings'

interface GoogleCalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Acessado pelo botão da Agenda ("Conectar Google Calendar") - direto,
 * sem as abas de Dados pessoais/Senha que `ProfileSettingsDialog`
 * (acessado por "Meu perfil") mostra junto, já que ali o contexto é só
 * "conectar minha agenda", não editar o resto da conta.
 */
export function GoogleCalendarDialog({ open, onOpenChange }: GoogleCalendarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Google Calendar</DialogTitle>
          <DialogDescription>Conecte sua conta pessoal do Google à Agenda do Puka.</DialogDescription>
        </DialogHeader>
        <GoogleCalendarSettings />
      </DialogContent>
    </Dialog>
  )
}
