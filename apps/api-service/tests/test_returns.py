"""Tests for the pure returns computations with hand-checked numbers."""

from __future__ import annotations

from datetime import date

import pandas as pd
import pytest
from app.returns import build_returns_payload, compute_daily_returns

from .conftest import make_close_frame

# Round numbers chosen so the returns land exactly on +10%, -10%, +10%.
PRICES = make_close_frame(
    {
        "AAPL": {
            "2024-01-01": 100.0,
            "2024-01-02": 110.0,
            "2024-01-03": 99.0,
            "2024-01-04": 108.9,
        }
    }
)


def test_compute_daily_returns_matches_manual_calculation() -> None:
    returns = compute_daily_returns(PRICES)["AAPL"]

    assert pd.isna(returns.loc["2024-01-01"])  # first row has no prior close
    assert returns.loc["2024-01-02"] == pytest.approx(0.10)
    assert returns.loc["2024-01-03"] == pytest.approx(-0.10)
    assert returns.loc["2024-01-04"] == pytest.approx(0.10)


def test_payload_uses_lookback_so_first_in_window_day_has_a_return() -> None:
    returns = compute_daily_returns(PRICES)
    # Window starts 01-02; the prior day (01-01) seeds its return.
    payload = build_returns_payload(returns, date(2024, 1, 2), date(2024, 1, 4), ["AAPL"])

    dates = [p.date.isoformat() for p in payload["AAPL"]]
    assert dates == ["2024-01-02", "2024-01-03", "2024-01-04"]
    assert payload["AAPL"][0].daily_return == pytest.approx(0.10)


def test_payload_drops_leading_nan_when_window_starts_at_first_price() -> None:
    returns = compute_daily_returns(PRICES)
    payload = build_returns_payload(returns, date(2024, 1, 1), date(2024, 1, 4), ["AAPL"])

    # 01-01 has no return and is omitted rather than emitted as null.
    dates = [p.date.isoformat() for p in payload["AAPL"]]
    assert dates == ["2024-01-02", "2024-01-03", "2024-01-04"]


def test_payload_window_end_is_inclusive() -> None:
    returns = compute_daily_returns(PRICES)
    payload = build_returns_payload(returns, date(2024, 1, 2), date(2024, 1, 3), ["AAPL"])

    dates = [p.date.isoformat() for p in payload["AAPL"]]
    assert dates == ["2024-01-02", "2024-01-03"]


def test_payload_rounds_returns() -> None:
    prices = make_close_frame({"AAPL": {"2024-01-01": 100.0, "2024-01-02": 100.0 * (1 + 1 / 3)}})
    returns = compute_daily_returns(prices)
    payload = build_returns_payload(returns, date(2024, 1, 2), date(2024, 1, 2), ["AAPL"])
    # 1/3 rounded to 6 decimals.
    assert payload["AAPL"][0].daily_return == 0.333333


def test_payload_includes_every_ticker_even_without_data() -> None:
    returns = compute_daily_returns(PRICES)
    payload = build_returns_payload(returns, date(2024, 1, 2), date(2024, 1, 4), ["AAPL", "MSFT"])
    assert payload["MSFT"] == []
    assert "MSFT" in payload
