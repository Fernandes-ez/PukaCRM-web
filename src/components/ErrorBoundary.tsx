import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro não tratado na interface:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="btn-cut-sm flex h-12 w-12 items-center justify-center bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Algo deu errado nesta tela</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Um erro inesperado interrompeu o carregamento. Tente recarregar — se continuar acontecendo, avise a
              equipe técnica.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Recarregar página</Button>
        </div>
      )
    }

    return this.props.children
  }
}
