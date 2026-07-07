# Acadian Assessment

This application is a simple full-stack app to visualize daily returns of the MAG7 stocks (MSFT, AAPL, GOOGL, AMZN, NVDA, META, TSLA) using data from yfinance.

---
## Architecture

This repository will be structured as a multilanguage monorepo using `just` as the root level task runner.

```markdown
- `apps/`          # Final applications with deployable code
  + `web-client/`  # React frontend (vite + typescript + react + redux toolkit)
  + `api-service/` # Backend API (FastAPI + Pydantic)
- `libs/`          # Shared custom code and business logic
  + `sdk/`         # An sdk generated from the server's OpenAPI docs (swagger) for clients to use.
- `packages/`      # Third-party dependencies and system scripts
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

Run `just setup` in the root of the project, the `just` taskrunner will run the inital setup scripts and install any required `npm` packages or `pip` modules. Then run `just deploy-all` to run everything locally, or `just develop` to deploy and run a watched instance of everything with live reload.

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
* [ ] Create a React component that displays a line chart of daily returns over time.
  * [ ] Ccreated the component and wired up to the redux data store.
  * [ ] Added date pickers for setting the start and end dates.
  * [ ] Makes an API call to `/returns` for the daily returns.
    * [ ] Import and use the backend's sdk.
      * [ ] Potential Improvement: Cache responses for days already queried. (Must decide how the cache should be invalidated)
      * [ ] Potential Improvement: When making multiple back-to-back date changes, cancel any pending promises, and only render the latest request.
  * [ ] Use `recharts` to plot the returns of each ticker in MAG7.
    * [ ] Line chart of daily returns for a given ticker
    * [ ] Allows zooming and tooltip inspection
    * [ ] Displays basic summary stats (min, max, mean).
      * [ ] Question: Geometric mean or arithmatic mean? For a hypothetical set of daily returns like [-0.5, 0.5] (50% loss and a 50% gain), the arithmatic mean is 0, but the geometric mean is -0.25 (a 25% loss because `[1 - 0.5] * [1 + 0.5] - 1 = -0.25`). I'm assuming that the geometric mean is preferred.
  * [ ] Ensure the frontend handles errors gracefully.
* [ ] Use `tailwind` to create a responsive grid UI and make everything look nice.
  


