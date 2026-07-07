"""Tests for ReturnsService orchestration: caching, TTLs, and validation."""

from __future__ import annotations

from datetime import date

import pytest
from app.config import Settings
from app.exceptions import InvalidDateRangeError
from app.service import ReturnsService

from .conftest import FakeClock, RecordingFetcher, make_close_frame

# Prices rise 1%/day; 01-09 seeds the return for the first window day (01-10).
PRICES = make_close_frame(
    {
        "AAPL": {
            "2024-01-09": 100.0,
            "2024-01-10": 101.0,
            "2024-01-11": 102.01,
            "2024-01-12": 103.0301,
        },
        "MSFT": {
            "2024-01-09": 200.0,
            "2024-01-10": 202.0,
            "2024-01-11": 204.02,
            "2024-01-12": 206.0602,
        },
    }
)


def _service(
    settings: Settings,
    *,
    clock: FakeClock | None = None,
    today: date = date(2024, 6, 1),
) -> tuple[ReturnsService, RecordingFetcher]:
    fetcher = RecordingFetcher(PRICES)
    service = ReturnsService(
        settings,
        fetch_fn=fetcher,
        clock=clock or FakeClock(),
        today_fn=lambda: today,
    )
    return service, fetcher


def test_returns_are_computed_for_the_window(two_ticker_settings: Settings) -> None:
    service, _ = _service(two_ticker_settings)

    payload = service.get_returns(date(2024, 1, 10), date(2024, 1, 12))

    assert set(payload) == {"AAPL", "MSFT"}
    dates = [p.date.isoformat() for p in payload["AAPL"]]
    assert dates == ["2024-01-10", "2024-01-11", "2024-01-12"]
    assert payload["AAPL"][0].daily_return == pytest.approx(0.01)


def test_fetch_uses_lookback_and_inclusive_end(two_ticker_settings: Settings) -> None:
    service, fetcher = _service(two_ticker_settings)

    service.get_returns(date(2024, 1, 10), date(2024, 1, 12))

    tickers, fetch_start, fetch_end = fetcher.calls[0]
    assert tickers == ["AAPL", "MSFT"]
    assert fetch_start == date(2023, 12, 31)  # start - 10 lookback days
    assert fetch_end == date(2024, 1, 13)  # end + 1 (yfinance end is exclusive)


def test_identical_requests_hit_the_cache(two_ticker_settings: Settings) -> None:
    service, fetcher = _service(two_ticker_settings)

    service.get_returns(date(2024, 1, 10), date(2024, 1, 12))
    service.get_returns(date(2024, 1, 10), date(2024, 1, 12))

    # The second call is served from cache, so the fetcher only ran once.
    assert len(fetcher.calls) == 1


def test_different_ranges_are_cached_separately(two_ticker_settings: Settings) -> None:
    service, fetcher = _service(two_ticker_settings)

    service.get_returns(date(2024, 1, 10), date(2024, 1, 12))
    service.get_returns(date(2024, 1, 10), date(2024, 1, 11))

    assert len(fetcher.calls) == 2


def test_historical_range_survives_the_recent_ttl(two_ticker_settings: Settings) -> None:
    clock = FakeClock()
    # end (01-12) is well before "today" (06-01) -> long historical TTL.
    service, fetcher = _service(two_ticker_settings, clock=clock, today=date(2024, 6, 1))

    service.get_returns(date(2024, 1, 10), date(2024, 1, 12))
    clock.advance(two_ticker_settings.recent_cache_ttl_seconds + 1)
    service.get_returns(date(2024, 1, 10), date(2024, 1, 12))  # still cached

    assert len(fetcher.calls) == 1


def test_recent_range_expires_after_short_ttl(two_ticker_settings: Settings) -> None:
    clock = FakeClock()
    # end (01-12) == "today" -> not strictly historical -> short TTL.
    service, fetcher = _service(two_ticker_settings, clock=clock, today=date(2024, 1, 12))

    service.get_returns(date(2024, 1, 10), date(2024, 1, 12))
    clock.advance(two_ticker_settings.recent_cache_ttl_seconds + 1)
    service.get_returns(date(2024, 1, 10), date(2024, 1, 12))  # cache expired -> refetch

    assert len(fetcher.calls) == 2


def test_start_after_end_is_rejected(two_ticker_settings: Settings) -> None:
    service, _ = _service(two_ticker_settings)
    with pytest.raises(InvalidDateRangeError):
        service.get_returns(date(2024, 1, 12), date(2024, 1, 10))


def test_range_larger_than_max_is_rejected() -> None:
    settings = Settings(tickers=("AAPL",), max_range_days=5)
    service, _ = _service(settings)
    with pytest.raises(InvalidDateRangeError):
        service.get_returns(date(2024, 1, 1), date(2024, 1, 31))
