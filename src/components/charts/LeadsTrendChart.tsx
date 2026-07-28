import { useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { LineChart as LineChartIcon, Table2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { buildLeadsTrend, GRANULARITY_LABEL, type Granularity, type TrendPoint } from '@/utils/leadAnalytics'
import { isValidDateString } from '@/utils/date'
import type { Lead } from '@/types/lead'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

const LINE_COLOR = { light: '#b105db', dark: '#d84cfb' }

interface DotProps {
  cx?: number
  cy?: number
  index?: number
  payload?: TrendPoint
}

/** Só marca e rotula o último ponto — "label selectively", nunca um valor em cada ponto. */
function makeEndDot(dataLength: number, color: string) {
  return function EndDot({ cx, cy, index, payload }: DotProps) {
    if (index !== dataLength - 1 || cx === undefined || cy === undefined) return null
    return (
      <g key="end-dot">
        <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--foreground)">
          {payload?.count}
        </text>
      </g>
    )
  }
}

interface LeadsTrendChartProps {
  leads: Lead[]
  isLoading: boolean
}

function TrendTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload as TrendPoint
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted-foreground">{point.fullLabel}</p>
      <p className="font-display text-lg font-bold leading-tight">
        {point.count} {point.count === 1 ? 'lead' : 'leads'}
      </p>
    </div>
  )
}

export function LeadsTrendChart({ leads, isLoading }: LeadsTrendChartProps) {
  const { resolvedTheme } = useTheme()
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const data = useMemo(() => buildLeadsTrend(leads, granularity), [leads, granularity])
  const color = LINE_COLOR[resolvedTheme]
  const hasData = leads.length > 0
  const undatedCount = useMemo(() => leads.filter((lead) => !isValidDateString(lead.created_at)).length, [leads])

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <span className="btn-cut-sm flex h-8 w-8 items-center justify-center bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            <LineChartIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold">Leads criados</p>
            <p className="text-xs text-muted-foreground">Novos contatos ao longo do tempo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
            <TabsList className="h-8">
              {(Object.keys(GRANULARITY_LABEL) as Granularity[]).map((g) => (
                <TabsTrigger key={g} value={g} className="h-6 px-2.5 text-xs">
                  {GRANULARITY_LABEL[g]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
            aria-label={view === 'chart' ? 'Ver como tabela' : 'Ver como gráfico'}
            title={view === 'chart' ? 'Ver como tabela' : 'Ver como gráfico'}
          >
            {view === 'chart' ? <Table2 className="h-4 w-4" /> : <LineChartIcon className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isLoading && undatedCount > 0 && (
          <p className="mb-3 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning-foreground dark:text-amber-300">
            {undatedCount === 1
              ? '1 lead está sem data de criação registrada e não aparece neste gráfico'
              : `${undatedCount} leads estão sem data de criação registrada e não aparecem neste gráfico`}{' '}
            (mas contam nos outros números).
          </p>
        )}
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !hasData ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Nenhum lead cadastrado ainda.
          </p>
        ) : view === 'table' ? (
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 font-medium">Período</th>
                  <th className="py-1.5 text-right font-medium">Leads criados</th>
                </tr>
              </thead>
              <tbody>
                {data.map((point) => (
                  <tr key={point.key} className="border-b last:border-0">
                    <td className="py-1.5">{point.fullLabel}</td>
                    <td className="py-1.5 text-right font-medium tabular-nums">{point.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 24, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  interval={granularity === 'day' ? 1 : 0}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip content={TrendTooltip} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="count" stroke="none" fill={color} fillOpacity={0.08} isAnimationActive={false} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={color}
                  strokeWidth={2}
                  dot={makeEndDot(data.length, color)}
                  activeDot={{ r: 5, fill: color, stroke: 'var(--card)', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
