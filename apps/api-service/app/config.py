# Runtime configuration.
#
# Values come from API_-prefixed environment variables, then an optional .env file, then the defaults below. get_settings() is cached so the app shares one
# Settings instance.

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# The MAG7 stock list.
MAG7_TICKERS: tuple[str, ...] = (
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "NVDA",
    "META",
    "TSLA",
)


# Every field can be overridden with an API_-prefixed env var, e.g. API_RECENT_CACHE_TTL_SECONDS=30.
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="API_",
        env_file=".env",
        extra="ignore",
    )

    tickers: tuple[str, ...] = MAG7_TICKERS

    # Caching. A range that already ended is "final" and safe to keep for a
    # while; a range touching today can still change as the session moves, so
    # it only gets a short TTL.
    historical_cache_ttl_seconds: int = 24 * 60 * 60  # 24 hours
    recent_cache_ttl_seconds: int = 10 * 60  # 10 minutes
    cache_max_entries: int = 256

    # Days to fetch before `start` so the first requested day has a prior close
    # to compute against. 10 covers weekends and multi-day exchange holidays.
    lookback_days: int = 10
    max_range_days: int = 366 * 10  # ~10 years; guardrail against huge requests
    fetch_timeout_seconds: int = 30  # network timeout for the data provider

    # CORS: Vite's dev server (5173) and its production preview server (4173).
    cors_origins: tuple[str, ...] = (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    )

#The process-wide Settings instance (cached).
@lru_cache
def get_settings() -> Settings:
    return Settings()
