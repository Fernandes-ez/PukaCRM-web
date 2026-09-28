import { cn } from '@/utils/cn'

interface EyebrowProps {
  children: React.ReactNode
  className?: string
  invert?: boolean
}

/** Rótulo pequeno acima de um título: haste + texto uppercase. */
export function Eyebrow({ children, className, invert }: EyebrowProps) {
  return (
    <span className={cn('eyebrow', invert ? 'text-white/70' : 'text-ribalta-funda dark:text-ribalta-acesa', className)}>
      <span className="eyebrow-mark" />
      {children}
    </span>
  )
}
