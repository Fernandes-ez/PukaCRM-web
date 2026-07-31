import { useState } from 'react'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useCloseAccount } from '@/hooks/useCompany'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/services/apiClient'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Company } from '@/types/company'

interface CloseAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company
}

/**
 * Ação irreversível pelo próprio Owner (backend não expõe endpoint de reversão — só o operador
 * da plataforma reverte direto no banco). Por isso exige digitar o slug da empresa pra confirmar,
 * em vez de um window.confirm simples.
 */
export function CloseAccountDialog({ open, onOpenChange, company }: CloseAccountDialogProps) {
  const closeAccount = useCloseAccount()
  const { logout } = useAuth()
  const [confirmText, setConfirmText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const canConfirm = confirmText.trim() === company.slug

  async function handleClose() {
    if (!canConfirm) return
    setFormError(null)
    try {
      await closeAccount.mutateAsync()
      logout()
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmText('')
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Encerrar conta</DialogTitle>
          <DialogDescription>Esta ação encerra o acesso de toda a empresa {company.name} à plataforma.</DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>Não é possível desfazer pela plataforma</AlertTitle>
          <AlertDescription>
            Ao confirmar, você — e todos os outros funcionários — perdem acesso imediatamente, incluindo você mesmo
            como Owner. O WhatsApp conectado também é desconectado automaticamente. Só o suporte pode reverter isso,
            direto no sistema; não existe uma tela pra "reabrir" a conta depois.
          </AlertDescription>
        </Alert>

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="confirm_slug">
            Digite <span className="font-mono font-semibold">{company.slug}</span> para confirmar
          </Label>
          <Input
            id="confirm_slug"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirm || closeAccount.isPending}
            onClick={handleClose}
          >
            {closeAccount.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Encerrar conta definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
