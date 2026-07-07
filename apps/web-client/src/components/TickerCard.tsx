import type { ReturnPoint } from '@acadian/sdk'

import type { TickerMeta } from '../constants'
import { formatSignedPercent } from '../lib/format'
import { computeSummary } from '../lib/stats'
import { ReturnsChart } from './ReturnsChart'

interface TickerCardProps {
  meta: TickerMeta
  points: readonly ReturnPoint[]
}

interface StatProps {
  label: string
  value: string
  tone?: 'up' | 'down' | 'neutral'
}

function Stat({ label, value, tone = 'neutral' }: StatProps) {
  const toneClass =
    tone === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'down'
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-700 dark:text-slate-200'
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  )
}

/** One grid tile: a ticker's return chart plus its min / max / mean stats. */
export function TickerCard({ meta, points }: TickerCardProps) {
  const summary = computeSummary(points)

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: meta.color }}
            aria-hidden="true"
          />
          <div>
            <h3 className="font-bold leading-none text-slate-900 dark:text-slate-100">
              {meta.symbol}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{meta.name}</p>
          </div>
        </div>
        {summary && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {summary.count} {summary.count === 1 ? 'day' : 'days'}
          </span>
        )}
      </header>

      {summary ? (
        <>
          <dl className="grid grid-cols-3 gap-2">
            <Stat label="Min" value={formatSignedPercent(summary.min)} tone="down" />
            <Stat
              label="Mean"
              value={formatSignedPercent(summary.mean)}
              tone={summary.mean >= 0 ? 'up' : 'down'}
            />
            <Stat label="Max" value={formatSignedPercent(summary.max)} tone="up" />
          </dl>
          <ReturnsChart points={points} color={meta.color} showBrush />
        </>
      ) : (
        <div className="flex h-[232px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
          No return data for this range.
        </div>
      )}
    </section>
  )
}
