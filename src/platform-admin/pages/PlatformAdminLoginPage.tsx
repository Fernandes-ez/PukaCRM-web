import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShieldHalf } from 'lucide-react'
import { usePlatformAdminAuth } from '@/platform-admin/context/PlatformAdminAuthContext'
import { ApiError } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Tela deliberadamente simples/utilitária, sem o painel de marca da
 * LoginPage normal - é um ponto de entrada interno, não voltado a
 * cliente. Reaproveita os componentes de UI de sempre, não a estética
 * de venda.
 */
export function PlatformAdminLoginPage() {
  const { login } = usePlatformAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/platform-admin/companies', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <ShieldHalf className="h-4 w-4" />
            Console interno
          </div>
          <h1 className="text-xl font-bold tracking-tight">Puka — Admin</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
