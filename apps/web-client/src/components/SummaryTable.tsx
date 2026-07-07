import { useMemo, useState } from 'react'

import type { ReturnsByTicker } from '@acadian/sdk'

import { TICKERS, type TickerMeta } from '../constants'
import { formatPercent, formatSignedPercent } from '../lib/format'
import { computeSummary, type ReturnsSummary } from '../lib/stats'

interface SummaryTableProps {
  data: ReturnsByTicker
}

interface Row {
  meta: TickerMeta
  summary: ReturnsSummary | null
}

type SortKey = 'symbol' | 'count' | 'mean' | 'min' | 'max' | 'volatility' | 'cumulative'
type SortDir = 'asc' | 'desc'

interface Column {
  key: SortKey
  label: string
  title: string
  numeric: boolean
}

const COLUMNS: Column[] = [
  { key: 'symbol', label: 'Ticker', title: 'Ticker symbol', numeric: false },
  { key: 'count', label: 'Days', title: 'Number of trading days', numeric: true },
  { key: 'mean', label: 'Mean', title: 'Average daily return', numeric: true },
  { key: 'min', label: 'Min', title: 'Worst single-day return', numeric: true },
  { key: 'max', label: 'Max', title: 'Best single-day return', numeric: true },
  { key: 'volatility', label: 'Volatility', title: 'Std. dev. of daily returns', numeric: true },
  { key: 'cumulative', label: 'Total', title: 'Compounded return over the window', numeric: true },
]

function signTone(value: number): string {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-slate-600 dark:text-slate-300'
}

export function SummaryTable({ data }: SummaryTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null)

  const rows: Row[] = useMemo(
    () =>
      TICKERS.map((meta) => ({
        meta,
        summary: computeSummary(data[meta.symbol] ?? []),
      })),
    [data],
  )

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      if (sort.key === 'symbol') {
        return factor * a.meta.symbol.localeCompare(b.meta.symbol)
      }
      const av = a.summary?.[sort.key]
      const bv = b.summary?.[sort.key]
      // Tickers without data always sort to the bottom.
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return factor * (av - bv)
    })
  }, [rows, sort])

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'symbol' ? 'asc' : 'desc' },
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">Summary of daily returns for each MAG7 ticker</caption>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {COLUMNS.map((column) => {
              const active = sort?.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  title={column.title}
                  aria-sort={
                    active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                  className={`px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 ${
                    column.numeric ? 'text-right' : 'text-left'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className={`inline-flex items-center gap-1 transition hover:text-slate-900 dark:hover:text-slate-100 ${
                      column.numeric ? 'flex-row-reverse' : ''
                    } ${active ? 'text-slate-900 dark:text-slate-100' : ''}`}
                  >
                    {column.label}
                    <span aria-hidden="true" className="text-xs">
                      {active ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map(({ meta, summary }) => (
            <tr
              key={meta.symbol}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
            >
              <th scope="row" className="px-4 py-3 text-left font-medium">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden="true"
                  />
                  <span className="text-slate-900 dark:text-slate-100">{meta.symbol}</span>
                  <span className="hidden text-xs text-slate-400 sm:inline dark:text-slate-500">
                    {meta.name}
                  </span>
                </span>
              </th>
              {summary ? (
                <>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {summary.count}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${signTone(summary.mean)}`}>
                    {formatSignedPercent(summary.mean)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-600 dark:text-red-400">
                    {formatSignedPercent(summary.min)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatSignedPercent(summary.max)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {formatPercent(summary.volatility)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold tabular-nums ${signTone(summary.cumulative)}`}
                  >
                    {formatSignedPercent(summary.cumulative)}
                  </td>
                </>
              ) : (
                <td
                  colSpan={COLUMNS.length - 1}
                  className="px-4 py-3 text-right text-slate-400 dark:text-slate-500"
                >
                  No data for this range
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
