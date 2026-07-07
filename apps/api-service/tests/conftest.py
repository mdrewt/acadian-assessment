"""Shared pytest fixtures and helpers.

Nothing here touches the network: market data is always synthetic, injected
through the fetch seam that ReturnsService exposes.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import date

import pandas as pd
import pytest
from app.config import Settings


def make_close_frame(prices: dict[str, dict[str, float]]) -> pd.DataFrame:
    """Build a wide close-price frame from {ticker: {"YYYY-MM-DD": price}}.

    Mirrors what normalize_close_prices produces: a tz-naive, normalised
    DatetimeIndex with one float column per ticker.
    """
    frame = pd.DataFrame(prices)
    frame.index = pd.to_datetime(frame.index).normalize()
    frame = frame.sort_index()
    return frame.astype("float64")


class RecordingFetcher:
    """A fake fetch function that returns preset data and records its calls."""

    def __init__(self, frame: pd.DataFrame) -> None:
        self._frame = frame
        self.calls: list[tuple[Sequence[str], date, date]] = []

    def __call__(self, tickers: Sequence[str], start: date, end: date) -> pd.DataFrame:
        self.calls.append((list(tickers), start, end))
        # Return only the requested tickers, preserving the fetch contract.
        return self._frame.reindex(columns=list(tickers))


class FakeClock:
    """A controllable monotonic clock for deterministic TTL tests."""

    def __init__(self, now: float = 1000.0) -> None:
        self.now = now

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


@pytest.fixture
def two_ticker_settings() -> Settings:
    """Small ticker universe so fixtures stay hand-checkable."""
    return Settings(
        tickers=("AAPL", "MSFT"),
        lookback_days=10,
        recent_cache_ttl_seconds=600,
        historical_cache_ttl_seconds=86_400,
    )
