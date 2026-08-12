import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany, useUpdateCompany } from '@/hooks/useCompany'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/utils/date'
import { COMPANY_STATUS_LABEL, type CompanyStatus } from '@/types/company'
import { CloseAccountDialog } from '@/pages/company/CloseAccountDialog'

const companySchema = z.object({
  name: z.string().min(2, 'Informe pelo menos 2 caracteres').max(150, 'Máximo de 150 caracteres'),
  phone: z.string().min(8, 'Informe um telefone válido').max(25, 'Máximo de 25 caracteres'),
  legal_name: z.string().max(200, 'Máximo de 200 caracteres').optional(),
  document: z.string().max(20, 'Máximo de 20 caracteres').optional(),
  website: z.string().max(255, 'Máximo de 255 caracteres').optional(),
  zip_code: z.string().max(10, 'Máximo de 10 caracteres').optional(),
  street: z.string().max(150, 'Máximo de 150 caracteres').optional(),
  number: z.string().max(20, 'Máximo de 20 caracteres').optional(),
  complement: z.string().max(100, 'Máximo de 100 caracteres').optional(),
  district: z.string().max(100, 'Máximo de 100 caracteres').optional(),
  city: z.string().max(100, 'Máximo de 100 caracteres').optional(),
  state: z.string().max(2, 'Use a sigla (2 letras)').optional(),
  country: z.string().max(100, 'Máximo de 100 caracteres').optional(),
})

type CompanyFormValues = z.infer<typeof companySchema>

const statusVariant: Record<CompanyStatus, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  TRIAL: 'warning',
  INACTIVE: 'secondary',
  SUSPENDED: 'destructive',
}

export function CompanyPage() {
  const { data: company, isLoading, isError, error } = useCompany()
  const updateCompany = useUpdateCompany()
  const { employee } = useAuth()
  const { toast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const [closeAccountOpen, setCloseAccountOpen] = useState(false)
  const [closingMessage, setClosingMessage] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    values: company
      ? {
          name: company.name,
          phone: company.phone,
          legal_name: company.legal_name ?? '',
          document: company.document ?? '',
          website: company.website ?? '',
          zip_code: company.zip_code ?? '',
          street: company.street ?? '',
          number: company.number ?? '',
          complement: company.complement ?? '',
          district: company.district ?? '',
          city: company.city ?? '',
          state: company.state ?? '',
          country: company.country ?? '',
        }
      : undefined,
  })

  useEffect(() => {
    if (company) setClosingMessage(company.closing_message ?? '')
  }, [company])

  async function handleSaveClosingMessage() {
    try {
      await updateCompany.mutateAsync({ closing_message: closingMessage })
      toast({ title: 'Mensagem de encerramento atualizada' })
    } catch (error) {
      toast({
        title: 'Não foi possível atualizar',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function onSubmit(data: CompanyFormValues) {
    setFormError(null)
    try {
      await updateCompany.mutateAsync({
        name: data.name,
        phone: data.phone,
        legal_name: data.legal_name || undefined,
        document: data.document || undefined,
        website: data.website || undefined,
        zip_code: data.zip_code || undefined,
        street: data.street || undefined,
        number: data.number || undefined,
        complement: data.complement || undefined,
        district: data.district || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        country: data.country || undefined,
      })
      toast({ title: 'Empresa atualizada', variant: 'success' })
    } catch (error) {
      if (error instanceof ApiError) {
        const knownFields: (keyof CompanyFormValues)[] = [
          'name',
          'phone',
          'legal_name',
          'document',
          'website',
          'zip_code',
          'street',
          'number',
          'complement',
          'district',
          'city',
          'state',
          'country',
        ]
        let matchedField = false
        for (const field of knownFields) {
          if (error.fieldErrors[field]) {
            setError(field, { message: error.fieldErrors[field] })
            matchedField = true
          }
        }
        if (!matchedField) setFormError(error.message)
      } else {
        setFormError('Ocorreu um erro inesperado. Tente novamente.')
      }
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Minha empresa</h1>
        <p className="text-sm text-muted-foreground">Dados cadastrais e encerramento de conta</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertDescription>{error instanceof ApiError ? error.message : 'Erro ao carregar.'}</AlertDescription>
        </Alert>
      ) : (
        company && (
          <>
            <Card notch="tr">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">{company.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {company.email} · desde {formatDate(company.created_at)}
                  </p>
                </div>
                <Badge variant={statusVariant[company.status]}>{COMPANY_STATUS_LABEL[company.status]}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Identificação</CardTitle>
                <CardDescription>Nome, razão social e contato</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" {...register('name')} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" {...register('phone')} />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="legal_name">Razão social (opcional)</Label>
                      <Input id="legal_name" {...register('legal_name')} />
                      {errors.legal_name && <p className="text-xs text-destructive">{errors.legal_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="document">CNPJ/CPF (opcional)</Label>
                      <Input id="document" {...register('document')} />
                      {errors.document && <p className="text-xs text-destructive">{errors.document.message}</p>}
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="website">Site (opcional)</Label>
                      <Input id="website" placeholder="https://" {...register('website')} />
                      {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm font-medium">Endereço (opcional)</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5 sm:col-span-1">
                      <Label htmlFor="zip_code">CEP</Label>
                      <Input id="zip_code" {...register('zip_code')} />
                      {errors.zip_code && <p className="text-xs text-destructive">{errors.zip_code.message}</p>}
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input id="street" {...register('street')} />
                      {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="number">Número</Label>
                      <Input id="number" {...register('number')} />
                      {errors.number && <p className="text-xs text-destructive">{errors.number.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input id="complement" {...register('complement')} />
                      {errors.complement && <p className="text-xs text-destructive">{errors.complement.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="district">Bairro</Label>
                      <Input id="district" {...register('district')} />
                      {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">Cidade</Label>
                      <Input id="city" {...register('city')} />
                      {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">UF</Label>
                      <Input id="state" maxLength={2} {...register('state')} />
                      {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">País</Label>
                      <Input id="country" {...register('country')} />
                      {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar alterações
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mensagem de encerramento</CardTitle>
                <CardDescription>
                  Enviada ao Lead pelo WhatsApp quando a conversa é fechada (manualmente ou automaticamente por
                  inatividade). Deixe em branco pra não mandar nada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={closingMessage}
                  onChange={(e) => setClosingMessage(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Ex: Encerramos este atendimento por aqui. Se precisar de mais alguma coisa, é só nos chamar novamente."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveClosingMessage}
                  disabled={updateCompany.isPending || closingMessage === (company.closing_message ?? '')}
                >
                  Salvar
                </Button>
              </CardContent>
            </Card>

            {employee?.is_owner && (
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Encerrar conta
                  </CardTitle>
                  <CardDescription>
                    Encerra o acesso de toda a empresa à plataforma. Só o Owner pode fazer isso, e não é reversível
                    por aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="destructive" onClick={() => setCloseAccountOpen(true)}>
                    Encerrar conta
                  </Button>
                </CardContent>
              </Card>
            )}

            {closeAccountOpen && (
              <CloseAccountDialog open={closeAccountOpen} onOpenChange={setCloseAccountOpen} company={company} />
            )}
          </>
        )
      )}
    </div>
  )
}
