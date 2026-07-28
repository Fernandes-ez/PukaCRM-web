import { cn } from '@/utils/cn'

interface HighlightWordProps {
  children: React.ReactNode
  className?: string
}

/** Palavra com listra diagonal atrás, no lugar de gradiente no texto inteiro. */
export function HighlightWord({ children, className }: HighlightWordProps) {
  return (
    <span className={cn('relative inline-block', className)}>
      <span
        aria-hidden="true"
        className="absolute inset-x-[-0.1em] bottom-[0.02em] h-[0.34em] bg-[repeating-linear-gradient(135deg,var(--brand-400)_0_3px,transparent_3px_7px)] opacity-80"
      />
      <span className="relative">{children}</span>
    </span>
  )
}
