import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setEnd, setRange, setStart } from '../features/dateRange/dateRangeSlice'
import { isoDaysAgo, todayIso, toIsoDate } from '../lib/dates'

interface Preset {
  label: string
  getRange: () => { start: string; end: string }
}

const PRESETS: Preset[] = [
  { label: '1M', getRange: () => ({ start: isoDaysAgo(30), end: todayIso() }) },
  { label: '3M', getRange: () => ({ start: isoDaysAgo(90), end: todayIso() }) },
  { label: '6M', getRange: () => ({ start: isoDaysAgo(182), end: todayIso() }) },
  { label: '1Y', getRange: () => ({ start: isoDaysAgo(365), end: todayIso() }) },
  {
    label: 'YTD',
    getRange: () => ({
      start: toIsoDate(new Date(new Date().getFullYear(), 0, 1)),
      end: todayIso(),
    }),
  },
]

const inputClass =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

/** Start/end date pickers plus quick-range presets. */
export function DateRangeControls() {
  const dispatch = useAppDispatch()
  const { start, end } = useAppSelector((state) => state.dateRange)
  const today = todayIso()
  const invalid = Boolean(start && end) && start > end

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
          Start date
          <input
            type="date"
            value={start}
            max={end || today}
            onChange={(event) => dispatch(setStart(event.target.value))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
          End date
          <input
            type="date"
            value={end}
            min={start}
            max={today}
            onChange={(event) => dispatch(setEnd(event.target.value))}
            className={inputClass}
          />
        </label>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick date ranges">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => dispatch(setRange(preset.getRange()))}
              className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {invalid && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          The start date must be on or before the end date.
        </p>
      )}
    </div>
  )
}
