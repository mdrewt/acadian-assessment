import { useMemo } from 'react'

import { useAppSelector } from './app/hooks'
import { DateRangeControls } from './components/DateRangeControls'
import { ErrorBanner } from './components/ErrorBanner'
import { LoadingState } from './components/LoadingState'
import { SummaryTable } from './components/SummaryTable'
import { TickerGrid } from './components/TickerGrid'
import { useGetReturnsQuery } from './features/returns/returnsApi'

function App() {
  const range = useAppSelector((state) => state.dateRange)
  // A date input reports '' while cleared or mid-edit; hold off until both are set.
  const incompleteRange = !range.start || !range.end
  const invalidRange = !incompleteRange && range.start > range.end

  const { data, isLoading, isFetching, isError, error, refetch } = useGetReturnsQuery(
    range,
    { skip: incompleteRange || invalidRange },
  )

  const hasAnyData = useMemo(
    () => (data ? Object.values(data).some((series) => series.length > 0) : false),
    [data],
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            MAG7 Daily Returns
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Explore daily percentage returns for the Magnificent Seven, computed from
            Yahoo Finance close prices.
          </p>
        </header>

        <DateRangeControls />

        {/* Subtle indicator for background refetches (data already on screen). */}
        {isFetching && !isLoading && (
          <div
            className="h-0.5 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-800"
            role="status"
            aria-label="Updating data"
          >
            <div className="h-full w-1/3 animate-pulse bg-blue-500" />
          </div>
        )}

        {invalidRange ? (
          <ErrorBanner message="Please choose a start date on or before the end date." />
        ) : isError ? (
          <ErrorBanner
            message={error?.message ?? 'Failed to load returns.'}
            onRetry={refetch}
          />
        ) : isLoading ? (
          <LoadingState />
        ) : data ? (
          <>
            {!hasAnyData && (
              <div
                className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
                role="status"
              >
                No trading days fall within the selected range. Try widening the dates.
              </div>
            )}
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Summary</h2>
              <SummaryTable data={data} />
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Return series</h2>
              <TickerGrid data={data} />
            </section>
          </>
        ) : null}

        <footer className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Data sourced from Yahoo Finance via yfinance. Returns are close-over-previous-close
          daily percentage changes. For educational use only.
        </footer>
      </div>
    </div>
  )
}

export default App
