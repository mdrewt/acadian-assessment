import type { ReturnPoint } from '@acadian/sdk'
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatDisplayDate, formatShortDate } from '../lib/dates'
import { formatPercent, formatSignedPercent } from '../lib/format'
import { useIsDarkMode } from '../lib/useIsDarkMode'

interface ReturnsChartProps {
  points: readonly ReturnPoint[]
  color: string
  height?: number
  /** Render a range-selection brush beneath the chart for zooming. */
  showBrush?: boolean
}

interface TooltipItem {
  value: number
  payload: ReturnPoint
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipItem[]
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const { date } = payload[0].payload
  const value = payload[0].value
  const positive = value >= 0
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="font-medium text-slate-500 dark:text-slate-400">
        {formatDisplayDate(date)}
      </p>
      <p
        className={
          positive
            ? 'font-semibold text-emerald-600 dark:text-emerald-400'
            : 'font-semibold text-red-600 dark:text-red-400'
        }
      >
        {formatSignedPercent(value)}
      </p>
    </div>
  )
}

/** A responsive daily-returns line chart with tooltip, zoom brush, and a
 *  zero baseline. */
export function ReturnsChart({
  points,
  color,
  height = 200,
  showBrush = false,
}: ReturnsChartProps) {
  const isDark = useIsDarkMode()
  const axisColor = isDark ? '#64748b' : '#94a3b8'
  const gridColor = isDark ? '#1e293b' : '#e2e8f0'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points as ReturnPoint[]} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fontSize: 11, fill: axisColor }}
          stroke={axisColor}
          minTickGap={28}
        />
        <YAxis
          tickFormatter={(value: number) => formatPercent(value, 1)}
          tick={{ fontSize: 11, fill: axisColor }}
          stroke={axisColor}
          width={48}
        />
        <ReferenceLine y={0} stroke={axisColor} strokeDasharray="2 2" />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="return"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
        {showBrush && (
          <Brush
            dataKey="date"
            height={22}
            travellerWidth={8}
            tickFormatter={formatShortDate}
            stroke={color}
            fill={isDark ? '#0f172a' : '#f8fafc'}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
