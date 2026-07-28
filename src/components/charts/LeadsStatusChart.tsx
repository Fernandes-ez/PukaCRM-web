import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { PieChart as PieChartIcon, Table2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { buildLeadsByStatus, LEAD_STATUS_COLOR, type StatusSlice } from '@/utils/leadAnalytics'
import type { Lead } from '@/types/lead'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface LeadsStatusChartProps {
  leads: Lead[]
  isLoading: boolean
}

function StatusTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null
  const slice = payload[0].payload as StatusSlice
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted-foreground">{slice.label}</p>
      <p className="font-display text-lg font-bold leading-tight">
        {slice.count} <span className="text-sm font-medium text-muted-foreground">({slice.percent.toFixed(0)}%)</span>
      </p>
    </div>
  )
}

export function LeadsStatusChart({ leads, isLoading }: LeadsStatusChartProps) {
  const { resolvedTheme } = useTheme()
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const slices = useMemo(() => buildLeadsByStatus(leads), [leads])
  const total = leads.length

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <span className="btn-cut-sm flex h-8 w-8 items-center justify-center bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            <PieChartIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold">Leads por status</p>
            <p className="text-xs text-muted-foreground">Distribuição atual</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
          aria-label={view === 'chart' ? 'Ver como tabela' : 'Ver como gráfico'}
          title={view === 'chart' ? 'Ver como tabela' : 'Ver como gráfico'}
        >
          {view === 'chart' ? <Table2 className="h-4 w-4" /> : <PieChartIcon className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : total === 0 ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Nenhum lead cadastrado ainda.
          </p>
        ) : view === 'table' ? (
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 font-medium">Status</th>
                  <th className="py-1.5 text-right font-medium">Leads</th>
                  <th className="py-1.5 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {slices.map((slice) => (
                  <tr key={slice.status} className="border-b last:border-0">
                    <td className="flex items-center gap-2 py-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: LEAD_STATUS_COLOR[slice.status][resolvedTheme] }}
                      />
                      {slice.label}
                    </td>
                    <td className="py-1.5 text-right font-medium tabular-nums">{slice.count}</td>
                    <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                      {slice.percent.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="68%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    stroke="var(--card)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.status} fill={LEAD_STATUS_COLOR[slice.status][resolvedTheme]} />
                    ))}
                  </Pie>
                  <Tooltip content={StatusTooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold leading-none tabular-nums">{total}</span>
                <span className="mt-1 text-[11px] text-muted-foreground">{total === 1 ? 'lead' : 'leads'}</span>
              </div>
            </div>

            <ul className="w-full space-y-1.5">
              {slices.map((slice) => (
                <li key={slice.status} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: LEAD_STATUS_COLOR[slice.status][resolvedTheme] }}
                  />
                  <span className="flex-1 text-muted-foreground">{slice.label}</span>
                  <span className="font-medium tabular-nums">{slice.count}</span>
                  <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                    {slice.percent.toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
