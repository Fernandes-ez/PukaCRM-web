import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Building2, Loader2, Bot, CheckCircle2, Contact, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/services/apiClient'
import type { CompanyOption } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LogoMark } from '@/components/brand/LogoMark'
import { Eyebrow } from '@/components/brand/Eyebrow'
import { HighlightWord } from '@/components/brand/HighlightWord'

const credentialsSchema = z.object({
  email: z.string().min(1, 'Informe seu email').email('Email inválido'),
  password: z.string().min(1, 'Informe sua senha'),
})

type CredentialsForm = z.infer<typeof credentialsSchema>

const features = [
  { icon: Bot, text: 'IA faz o primeiro atendimento e chama você quando precisar' },
  { icon: Contact, text: 'Leads e conversas organizados em um só lugar' },
  { icon: ShieldCheck, text: 'Equipe e permissões sob seu controle' },
]

export function LoginPage() {
  const { login, selectCompany, logoutReason, clearLogoutReason } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
  const [searchParams] = useSearchParams()
  const emailFromQuery = searchParams.get('email') ?? ''

  const [companies, setCompanies] = useState<CompanyOption[] | null>(null)
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null)
  const [selectingCompanyId, setSelectingCompanyId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  // Captura o motivo uma vez (o context limpa logo em seguida) pra não sumir antes do usuário ler.
  const [sessionReason] = useState(() => logoutReason)

  useEffect(() => {
    if (logoutReason) clearLogoutReason()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: emailFromQuery },
  })

  async function onSubmitCredentials(data: CredentialsForm) {
    setFormError(null)
    try {
      const requiredCompanies = await login(data.email, data.password)
      if (requiredCompanies) {
        setCompanies(requiredCompanies)
        setPendingCredentials(data)
        return
      }
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors.email) setError('email', { message: error.fieldErrors.email })
        if (error.fieldErrors.password) setError('password', { message: error.fieldErrors.password })
        if (!error.fieldErrors.email && !error.fieldErrors.password) setFormError(error.message)
      } else {
        setFormError('Ocorreu um erro inesperado. Tente novamente.')
      }
    }
  }

  async function handleSelectCompany(companyId: string) {
    if (!pendingCredentials) return
    setFormError(null)
    setSelectingCompanyId(companyId)
    try {
      await selectCompany(pendingCredentials.email, pendingCredentials.password, companyId)
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setSelectingCompanyId(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Painel de marca */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-coxia p-10 text-roteiro lg:flex">
        {/* A deixa (curva da marca), sangrando pela borda direita — ver puka-marca/logo/puka-simbolo-cor.svg. */}
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="33 -694 479 694"
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto opacity-90"
        >
          <g transform="scale(1 -1)">
            <path fill="#E8704A" d="M364 527C318 450 221.02 344 221.02 270C221.02 192 280 86 312 0H512C458 92 386 180 386 262C386 334 452 440 498 527Z" />
          </g>
        </svg>

        <div className="relative z-10 flex items-center gap-2.5">
          <LogoMark invert />
          <span className="font-display text-lg font-semibold tracking-tight">Puka</span>
        </div>

        <div className="relative z-10 max-w-md">
          <Eyebrow invert>Atendimento inteligente</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight">
            Atendimento via WhatsApp com <HighlightWord>IA</HighlightWord>, tudo em um só lugar.
          </h1>
          <p className="mt-4 text-roteiro/70">
            Centralize conversas, leads e sua equipe em uma plataforma feita para pequenas e médias empresas.
          </p>

          <ul className="mt-8 space-y-3">
            {features.map((feature) => (
              <li key={feature.text} className="flex items-start gap-3 text-sm text-roteiro/85">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-white/20">
                  <feature.icon className="h-3.5 w-3.5" />
                </span>
                {feature.text}
              </li>
            ))}
          </ul>

          <div className="mt-8 h-px w-24 bg-white/30" />

          {/* Mockup de conversa */}
          <div className="mt-6 w-80 border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center gap-2 text-xs text-roteiro/60">
              <span className="h-2 w-2 rounded-full bg-success" />
              Conversa · agora
            </div>
            <div className="mt-3 space-y-2">
              <div className="max-w-[80%] border border-white/10 bg-white/90 px-3 py-2 text-sm text-coxia">
                Oi! Vocês têm horário disponível amanhã de manhã?
              </div>
              <div className="ml-auto flex max-w-[80%] flex-col items-end gap-1">
                <div className="border-l-4 border-ponto-claro bg-white/10 px-3 py-2 text-sm">
                  Consigo verificar aqui! Prefere 9h ou 10h?
                </div>
                <span className="flex items-center gap-1 pr-1 font-mono text-[10px] text-roteiro/50">
                  <Bot className="h-3 w-3" /> respondido pela IA
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm text-roteiro/50">© {new Date().getFullYear()} Puka</p>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <LogoMark />
            <span className="font-display text-lg font-semibold tracking-tight">Puka</span>
          </div>

          <Card>
            {!companies ? (
              <>
                <CardHeader className="pt-7">
                  <h2 className="text-2xl font-bold tracking-tight">Entrar</h2>
                  <p className="text-sm text-muted-foreground">Acesse sua conta para continuar</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmitCredentials)} className="space-y-4">
                    {sessionReason && (
                      <Alert variant="destructive">
                        <AlertDescription>{sessionReason}</AlertDescription>
                      </Alert>
                    )}
                    {formError && (
                      <Alert variant="destructive">
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" autoComplete="email" {...register('email')} />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Senha</Label>
                      <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
                      {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Entrar
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="pt-7">
                  <h2 className="text-2xl font-bold tracking-tight">Escolha a empresa</h2>
                  <p className="text-sm text-muted-foreground">Seu email está associado a mais de uma empresa</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        disabled={selectingCompanyId !== null}
                        onClick={() => handleSelectCompany(company.id)}
                        className="flex w-full items-center gap-3 border px-3 py-2.5 text-left text-sm transition-all hover:border-primary/50 hover:bg-accent disabled:opacity-60"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="flex-1 font-medium">{company.name}</span>
                        {selectingCompanyId === company.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setCompanies(null)
                      setPendingCredentials(null)
                      setFormError(null)
                    }}
                  >
                    Voltar
                  </Button>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
