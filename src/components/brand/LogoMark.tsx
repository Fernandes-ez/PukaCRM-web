import simboloCor from '@/assets/brand/puka-simbolo-cor.svg'
import simboloNegativo from '@/assets/brand/puka-simbolo-negativo.svg'
import { cn } from '@/utils/cn'

const sizes = {
  sm: 'h-8',
  md: 'h-9',
  lg: 'h-14',
} as const

interface LogoMarkProps {
  size?: keyof typeof sizes
  className?: string
  /** Sobre fundo escuro (ex: sidebar) — usa a versão negativa do símbolo. */
  invert?: boolean
}

/** Símbolo oficial da marca (o "k" desenhado) — nunca recriar com fonte. */
export function LogoMark({ size = 'md', className, invert }: LogoMarkProps) {
  return (
    <img
      src={invert ? simboloNegativo : simboloCor}
      alt="Puka"
      className={cn('w-auto shrink-0 object-contain', sizes[size], className)}
    />
  )
}
