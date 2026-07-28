import { cn } from '@/utils/cn'

interface EyebrowProps {
  children: React.ReactNode
  className?: string
  invert?: boolean
}

/** Rótulo pequeno acima de um título: quadradinho com listra diagonal + texto uppercase. */
export function Eyebrow({ children, className, invert }: EyebrowProps) {
  return (
    <span className={cn('eyebrow', invert ? 'text-white/70' : 'text-brand-600 dark:text-brand-400', className)}>
      <span className="eyebrow-mark" />
      {children}
    </span>
  )
}
