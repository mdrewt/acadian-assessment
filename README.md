# Acadian Assessment

This application is a simple full-stack app to visualize daily returns of the MAG7 stocks (MSFT, AAPL, GOOGL, AMZN, NVDA, META, TSLA) using data from yfinance.

---
## Architecture

This repository is a multilanguage monorepo: `just` is the root-level task runner and npm workspaces handle the TypeScript packages. The backend defines the API. Its OpenAPI schema is used to generate the SDK, and the frontend imports that SDK instead of hand-writing types or URLs.

```markdown
- `.github/`         # CI workflow
- `apps/`          # Final applications with deployable code
  + `web-client/`  # React frontend (vite + typescript + react + redux toolkit)
  + `api-service/` # Backend API (FastAPI + Pydantic)
- `libs/`          # Shared custom code and business logic
  + `sdk/`         # An sdk generated from the server's OpenAPI docs (swagger) for clients to use.
```

---
## Quick Start

Requirements:
* Node Version >= 24.18.*
* Python version >= 3.14.*
* just version >= 1.55.*

Use you preferred version manager(s) (I like `asdf`) to install the appropriate versions of Node and Python, then install `just` via one of the following methods:
* macOS: `brew install just`
* Linux: `sudo apt install just`
* Windows: `winget install casey.just` (Requires the `sh` shell provided by `Git for Windows`, `GitHub Desktop`, or `Cygwin`)

Learn more about `just` here: [Quick Start](https://just.systems/man/en/quick-start.html) | [Github](https://github.com/casey/just)

Run `just setup` in the root of the project, the `just` taskrunner will run the inital setup scripts and install any required `npm` packages or `pip` modules. Then run `just develop` to deploy and run a watched instance of everything with live reload.
Finally open http://localhost:5173. Interactive API docs are at http://localhost:8000/docs.

---
## A few decisions worth noting

The assessment left some things open, so for the record:

- A daily return here is the close-over-previous-close change, `(close_t - close_{t-1}) / close_{t-1}`. To get a return for the first day in the requested window, the backend fetches a few extra days before `start` and then trims back to `[start, end]`, so the first day still shows a real return against the previous session's close.
- Prices are split/dividend-adjusted (`auto_adjust=True`), which is the right basis for computing returns.
- For "mean" I show the arithmetic mean of the daily returns, alongside volatility (sample standard deviation) and a compounded total return (`prod(1 + r) - 1`). The compounded figure is there because a plain average hides the fact that +50% then -50% is actually a -25% round trip.
- Results are cached in memory by `(start, end)`. A range that's entirely in the past won't change, so it's kept for a day; a range that includes today gets a short 10-minute TTL since those prices are still moving. Expired entries are dropped on read.
- I didn't add any trading-calendar logic. yfinance only returns days that actually traded, so weekends and holidays simply aren't in the data.

---
## TODOs List

* [x] Initialize Git repository with a rough `README.md` that outlines the project.
* [x] Set up the project's file structure and initialize a `Hello World` version of the applications.
  * [x] Frontend spun up with Vite, Typescript, and React.
  * [x] Setup, Dev, and Deployment script wired up for the frontend.
  * [x] Backend spun up with Python, FastAPI, and Pydantic.
  * [x] Setup, Dev, and Deployment script wired up for the backend.
* [x] Install and setup the `yfinance` python module.
  * [x] Ensure it can fetch the information required to calculate daily returns.
  * [x] Create pydantic types for the fetched data.
  * [x] Build unit tests for for the yfinance service with mock data.
* [x] Setup an endpoint to fetch the daily returns of the MAG7 symbols.
  * [x] `/returns` Endpoint exists.
    * [x] Build tests for endpoint first (TDD).
  * [x] Takes a start date called `start` and an end date called `end` as query params.
  * [x] Fetches data from yfinance.
    * [x] Potential Improvement: Caching previously fetched historical data. (Must decide how the cache should be invalidated)
  * [x] Calculates daily returns for each day, for each ticker in MAG7
    * [x] Build tests for calculation module first (TDD).
    * [x] Question: What should we use as the start/end values for each day? The NYSE opening/closing prices, prices at midnight of each day, or closing price vs previous day's closing price? Should we only count business days and exclude weekends + NYSE holidays?
  * [x] Ensure the backend handles errors gracefully.
* [x] Take the API's swagger (openAPI) docs and build a type-aware SDK that the frontend can use.
* [x] Create a React component that displays a line chart of daily returns over time.
  * [x] Created the component and wired up to the redux data store.
  * [x] Added date pickers for setting the start and end dates.
  * [x] Makes an API call to `/returns` for the daily returns.
    * [x] Import and use the backend's sdk.
  * [x] Use `recharts` to plot the returns of each ticker in MAG7.
    * [x] Line chart of daily returns for a given ticker
    * [x] Allows zooming and tooltip inspection
    * [x] Displays basic summary stats (min, max, mean).
      * [x] Question: what should "mean" be? A plain arithmetic mean of daily returns hides compounding: `[-0.5, 0.5]` averages to 0%, but the round trip is actually a 25% loss (`(1 - 0.5) * (1 + 0.5) - 1 = -0.25`). Decision: show the arithmetic mean as "Mean" and report the compounded total (`prod(1 + r) - 1`) as a separate "Total" column, so neither figure misleads. Volatility (sample std. dev.) rounds out the summary.
  * [x] Ensure the frontend handles errors gracefully.
* [x] Use `tailwind` to create a responsive grid UI and make everything look nice.
  


