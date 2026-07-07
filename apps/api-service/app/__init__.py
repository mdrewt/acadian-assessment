# MAG7 daily-returns API service.

# A small FastAPI backend that fetches daily close prices for the MAG7 stocks
# from Yahoo Finance (via yfinance), computes daily percentage returns with
# pandas, and serves them from a single /returns endpoint.

# The package is split by responsibility:
#   - config holds settings, fetcher is the yfinance boundary
#   - returns does the pandas math
#   - cache is a small TTL cache,
#   - service ties them together (validate -> cache -> fetch -> compute)
#   - routers handles the HTTP layer.

__version__ = "1.0.0"
