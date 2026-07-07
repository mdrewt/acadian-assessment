# Web Client

React + TypeScript frontend for the MAG7 Daily Returns app. Built with Vite,
Redux Toolkit (RTK Query), Tailwind CSS v4, and Recharts.

## Running

From the repo root: `just develop-web` starts Vite on http://localhost:5173.
Directly:

```bash
npm run dev        # dev server
npm run build      # type-check (tsc) + production bundle
npm run test       # vitest
npm run lint       # oxlint
```

The dev server expects the API at http://localhost:8000. Override that with
`VITE_API_URL` (copy `.env.example` to `.env`). The client imports the generated
`@acadian/sdk`, so build it first with `just build-sdk` (or `just setup`, which
does everything).

## Structure

```text
src/
├── main.tsx                 # bootstrap: configure the SDK, mount the Redux <Provider>
├── App.tsx                  # layout plus loading/error/empty states
├── config.ts                # API base URL from VITE_API_URL
├── constants.ts             # MAG7 tickers, display names, chart colours
├── app/
│   ├── store.ts             # Redux store (RTK Query + date-range slice)
│   └── hooks.ts             # typed useAppDispatch / useAppSelector
├── features/
│   ├── dateRange/           # selected start/end date state
│   └── returns/             # RTK Query API backed by the SDK
├── lib/                     # pure helpers: stats, dates, formatting, theme hook
└── components/              # DateRangeControls, SummaryTable, TickerGrid,
                             #   TickerCard, ReturnsChart, ErrorBanner, LoadingState
```

## Data layer

`features/returns/returnsApi.ts` wraps the generated SDK's `getReturns` in an
RTK Query base query. That gets us response caching (keyed by the
`{ start, end }` range), request de-duplication, and cancellation of superseded
requests via the abort signal, so changing the date range quickly only ever
renders the latest response. The summary stats (min, max, mean, volatility,
cumulative) are computed on the client in `lib/stats.ts` from the `/returns`
payload.

## Testing

vitest + Testing Library (jsdom), covering the parts with real logic:

- `lib/stats.test.ts`: the summary statistics, including compounding and volatility.
- `lib/dates.test.ts`: timezone-safe ISO date handling.
- `features/returns/returnsApi.test.ts`: the SDK-backed base query: success,
  error-envelope mapping, 422 flattening, and network failures.
- `components/SummaryTable.test.tsx`: per-ticker rendering and column sorting.
- `components/TickerCard.test.tsx`: stats rendering, chart mounting, empty state.
