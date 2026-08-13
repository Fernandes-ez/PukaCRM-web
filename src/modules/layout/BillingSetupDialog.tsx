import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUpdateCompany } from '@/hooks/useCompany'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const schema = z.object({
  document: z.string().min(11, 'Informe um CPF ou CNPJ válido').max(20, 'Máximo de 20 caracteres'),
})

type FormValues = z.infer<typeof schema>

interface BillingSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Abre sozinho uma vez, quando o componente monta (equivale a "uma vez por sessão/login"). */
  autoOpen?: boolean
}

/**
 * Popup pra completar CPF/CNPJ e reativar a cobrança (decisão do
 * usuário, 2026-08-13) - complementa o banner persistente com um
 * empurrão mais direto. **Dispensável**, não trava a plataforma (ao
 * contrário do popup obrigatório de trocar senha) - o usuário pode
 * fechar e continuar usando normalmente, o banner continua ali até
 * resolver. Preencher aqui já dispara o retry de provisionamento no
 * Asaas do lado do backend (`CompanyService.update` →
 * `SubscriptionService.retry_provisioning`), sem passo manual extra.
 */
export function BillingSetupDialog({ open, onOpenChange, autoOpen }: BillingSetupDialogProps) {
  const { hasPermission } = useAuth()
  const updateCompany = useUpdateCompany()
  const { toast } = useToast()
  const canEdit = hasPermission('COMPANY', 'company', 'UPDATE')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (autoOpen) onOpenChange(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(data: FormValues) {
    try {
      await updateCompany.mutateAsync({ document: data.document })
      toast({ title: 'Cadastro completo - reativando a cobrança', variant: 'success' })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Não foi possível salvar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Período de teste acabou</DialogTitle>
          <DialogDescription>
            Ainda não há uma forma de cobrança configurada pra esta empresa.
          </DialogDescription>
        </DialogHeader>

        {canEdit ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="billing_document">CPF ou CNPJ da empresa</Label>
              <Input id="billing_document" placeholder="Só números ou com pontuação" {...register('document')} />
              {errors.document && <p className="text-xs text-destructive">{errors.document.message}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              Assim que salvar, tentamos ativar a cobrança automaticamente pelo Asaas.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Agora não
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar e ativar cobrança
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <Alert>
              <AlertDescription>
                Fale com o Dono ou Administrador da sua empresa pra completar o cadastro e reativar a cobrança.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Entendi
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
