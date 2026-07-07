# API Service

FastAPI backend for the MAG7 Daily Returns app. It fetches daily close prices
for the Magnificent Seven from Yahoo Finance (via yfinance), computes daily
percentage returns with pandas, and serves them from a single `/returns`
endpoint.

## Running

From the repo root: `just develop-api` starts the dev server (auto-reload) on
http://localhost:8000, with interactive docs at http://localhost:8000/docs.
Directly, from this directory with the venv active:

```bash
.venv/bin/fastapi dev app/main.py    # dev server (reload)
.venv/bin/fastapi run app/main.py    # production server
.venv/bin/pytest                     # tests
.venv/bin/ruff check .               # lint
.venv/bin/ruff format .              # format
```

The venv and dependencies are created by `just setup` (or `just install-py`).

## Endpoint

`GET /returns?start=YYYY-MM-DD&end=YYYY-MM-DD`

Returns each MAG7 ticker's daily percentage returns over the inclusive
`[start, end]` window. A daily return is the close-over-previous-close change,
`(close_t - close_{t-1}) / close_{t-1}`. The response is keyed by ticker symbol:

```json
{
  "AAPL": [{ "date": "2024-01-03", "return": 0.007 }, ...],
  "MSFT": [ ... ]
}
```

Every requested ticker is always present as a key; a ticker with no data for the
range maps to an empty array. Days without a return (a leading day with no prior
close, or a non-trading day) are simply omitted rather than emitted as null.

Errors use a consistent `{"detail": "..."}` envelope: `400` for an invalid range
(e.g. `start` after `end`), `422` for malformed query parameters, and `502` when
the upstream data provider fails.

## Structure

```text
app/
├── main.py          # app factory, CORS, lifespan-built service
├── config.py        # Settings (env-overridable) + the MAG7 ticker list
├── routers/
│   └── returns.py   # the /returns HTTP handler
├── dependencies.py  # provides the shared ReturnsService to routes
├── service.py       # use case: validate -> cache -> fetch -> compute
├── fetcher.py       # yfinance boundary: download + normalise close prices
├── returns.py       # pure pandas return math (no I/O)
├── cache.py         # small in-memory TTL cache keyed by (start, end)
├── schemas.py       # Pydantic request/response models (drive the OpenAPI schema)
└── exceptions.py    # application errors + JSON error handler
scripts/
└── export_openapi.py  # dump the OpenAPI schema to libs/sdk/openapi.json
tests/                 # pytest suite (see below)
```

The layering keeps the two things that are hard to test — the network and the
wall clock — behind seams. `ReturnsService` takes an injectable `fetch_fn`,
`clock`, and `today_fn`, so the whole request flow runs against synthetic data
in tests. `returns.py` is pure math over small pandas frames.

## Caching

Results are cached in memory by `(start, end)`. A range that has already ended
won't change, so it's kept for 24 hours; a range that includes today still moves
as the session trades, so it gets a short 10-minute TTL. Entries expire on read,
and when the cache is full the entry closest to expiring is evicted. TTLs and the
cache size are configurable (see below).

## Configuration

Every `Settings` field can be overridden with an `API_`-prefixed environment
variable (or an `.env` file), e.g. `API_RECENT_CACHE_TTL_SECONDS=30`. Notable
knobs: `API_LOOKBACK_DAYS` (extra days fetched before `start` so the first day in
the window has a prior close), the two cache TTLs, `API_CACHE_MAX_ENTRIES`,
`API_MAX_RANGE_DAYS`, `API_FETCH_TIMEOUT_SECONDS`, and `API_CORS_ORIGINS`.

## Testing

```bash
.venv/bin/pytest              # run the suite
.venv/bin/pytest --cov        # with coverage
```

No test touches the network or the real clock; market data is synthetic and
injected through the service's fetch seam. Warnings are treated as errors.

- `test_returns.py`: the pure return math with hand-checked numbers.
- `test_fetcher.py`: normalising yfinance's frame shapes and wrapping provider
  failures as `DataFetchError`.
- `test_cache.py`: cache hits, TTL expiry, and capacity eviction.
- `test_service.py`: orchestration — caching, TTL selection, and validation.
- `test_endpoint.py`: the full HTTP path via FastAPI's `TestClient`, including
  the real production wiring with only the network boundary mocked.
