import { useState } from 'react'
import { Check, Copy, ShieldAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface SecretRevealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  label: string
  secret: string
}

export function SecretRevealDialog({ open, onOpenChange, title, label, secret }: SecretRevealDialogProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Guarde este valor agora — ele não poderá ser recuperado depois.</DialogDescription>
        </DialogHeader>

        <Alert variant="warning">
          <ShieldAlert />
          <AlertTitle>Isso não vai aparecer de novo</AlertTitle>
          <AlertDescription>
            Copie {label.toLowerCase()} agora e compartilhe com segurança. Depois de fechar esta janela, não será
            possível consultá-lo novamente.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">
          <span className="flex-1">{secret}</span>
          <Button type="button" variant="ghost" size="icon" onClick={handleCopy} aria-label="Copiar">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Já guardei, fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
