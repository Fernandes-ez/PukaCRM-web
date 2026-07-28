import pukaIcon from '@/assets/brand/puka-icon.png'
import { cn } from '@/utils/cn'

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-14 w-14',
} as const

interface LogoMarkProps {
  size?: keyof typeof sizes
  className?: string
}

/** Símbolo da marca Puka. */
export function LogoMark({ size = 'md', className }: LogoMarkProps) {
  return (
    <img
      src={pukaIcon}
      alt="Puka"
      className={cn('shrink-0 object-contain', sizes[size], className)}
    />
  )
}
