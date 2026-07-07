# The /returns use case: validate, check the cache, fetch, compute, cache.
#
# The fetch function, clock, and "today" are injectable so the whole flow can be run in tests without hitting the network or the wall clock.

from __future__ import annotations

import time
from collections.abc import Callable
from datetime import date, timedelta

import pandas as pd

from .cache import ReturnsCache
from .config import Settings
from .exceptions import InvalidDateRangeError
from .fetcher import fetch_close_prices
from .returns import build_returns_payload, compute_daily_returns
from .schemas import ReturnsResponse

# (tickers, start, end) -> wide close-price frame. Swapped for synthetic data in tests.
FetchFn = Callable[[list[str], date, date], pd.DataFrame]


# Compute and cache MAG7 daily returns for a date range.
class ReturnsService:
    def __init__(
        self,
        settings: Settings,
        *,
        fetch_fn: FetchFn = fetch_close_prices,
        clock: Callable[[], float] = time.monotonic,
        today_fn: Callable[[], date] = date.today,
    ) -> None:
        self._settings = settings
        self._fetch = fetch_fn
        self._today_fn = today_fn
        self._cache = ReturnsCache(max_entries=settings.cache_max_entries, clock=clock)

    # Daily returns for every configured ticker over [start, end].
    def get_returns(self, start: date, end: date) -> ReturnsResponse:
        self._validate_range(start, end)

        key = (start, end)
        cached = self._cache.get(key)
        if cached is not None:
            return cached

        tickers = list(self._settings.tickers)
        # Fetch a few days before `start` so the first day in the window has a
        # prior close to compare against. yfinance treats `end` as exclusive, so
        # bump it by a day to include the requested end date.
        fetch_start = start - timedelta(days=self._settings.lookback_days)
        fetch_end = end + timedelta(days=1)

        close_prices = self._fetch(tickers, fetch_start, fetch_end)
        returns = compute_daily_returns(close_prices)
        payload = build_returns_payload(returns, start, end, tickers)

        self._cache.set(key, payload, self._ttl_for(end))
        return payload

    def _ttl_for(self, end: date) -> int:
        # A range that has already ended won't change, so cache it for a day.
        # Anything touching today is still moving, so keep it only briefly.
        if end < self._today_fn():
            return self._settings.historical_cache_ttl_seconds
        return self._settings.recent_cache_ttl_seconds

    def _validate_range(self, start: date, end: date) -> None:
        if start > end:
            raise InvalidDateRangeError("`start` must be on or before `end`.")
        if (end - start).days > self._settings.max_range_days:
            raise InvalidDateRangeError(
                f"Requested range exceeds the maximum of {self._settings.max_range_days} days."
            )
