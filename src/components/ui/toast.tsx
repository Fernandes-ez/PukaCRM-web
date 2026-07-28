import * as React from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastVariant = 'default' | 'success' | 'destructive'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; variant?: ToastVariant }) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = React.useCallback<ToastContextValue['toast']>(
    ({ title, description, variant = 'default' }) => {
      const id = crypto.randomUUID()
      setItems((prev) => [...prev, { id, title, description, variant }])
      window.setTimeout(() => dismiss(id), 5000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-2',
              item.variant === 'success' && 'bg-success text-success-foreground border-transparent',
              item.variant === 'destructive' && 'bg-destructive text-destructive-foreground border-transparent',
              item.variant === 'default' && 'bg-card text-card-foreground',
            )}
          >
            {item.variant === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0" />}
            {item.variant === 'destructive' && <AlertCircle className="h-5 w-5 shrink-0" />}
            <div className="flex-1 text-sm">
              <p className="font-medium">{item.title}</p>
              {item.description && <p className="mt-0.5 opacity-90">{item.description}</p>}
            </div>
            <button onClick={() => dismiss(item.id)} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
