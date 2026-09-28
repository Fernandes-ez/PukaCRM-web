import { cn } from '@/utils/cn'

interface HighlightWordProps {
  children: React.ReactNode
  className?: string
}

/** Palavra com sublinhado Ponto (a marca usa essa cor pra tudo que é IA). */
export function HighlightWord({ children, className }: HighlightWordProps) {
  return (
    <span className={cn('relative inline-block', className)}>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-[0.02em] h-[3px] bg-ponto-claro" />
      <span className="relative">{children}</span>
    </span>
  )
}
