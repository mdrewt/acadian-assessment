"""Tests for the yfinance boundary.

The pure normaliser is tested directly; the network call is patched to prove
provider failures are translated into DataFetchError.
"""

from __future__ import annotations

from datetime import date

import pandas as pd
import pytest
from app import fetcher
from app.exceptions import DataFetchError
from app.fetcher import fetch_close_prices, normalize_close_prices


def _raw_multiindex_frame() -> pd.DataFrame:
    """Mimic yfinance's group_by='column' output: (field, ticker) columns."""
    index = pd.to_datetime(["2024-01-02", "2024-01-03"])
    columns = pd.MultiIndex.from_tuples(
        [("Close", "AAPL"), ("Close", "MSFT"), ("Open", "AAPL"), ("Open", "MSFT")]
    )
    data = [
        [185.0, 370.0, 184.0, 369.0],
        [186.0, 372.0, 185.5, 371.0],
    ]
    return pd.DataFrame(data, index=index, columns=columns)


def test_normalize_extracts_close_columns_in_order() -> None:
    result = normalize_close_prices(_raw_multiindex_frame(), ["AAPL", "MSFT"])

    assert list(result.columns) == ["AAPL", "MSFT"]
    assert result.loc["2024-01-02", "AAPL"] == 185.0
    assert result.loc["2024-01-03", "MSFT"] == 372.0


def test_normalize_index_is_tz_naive_and_normalised() -> None:
    result = normalize_close_prices(_raw_multiindex_frame(), ["AAPL", "MSFT"])
    assert result.index.tz is None
    assert (result.index == result.index.normalize()).all()


def test_normalize_fills_missing_ticker_with_nan_column() -> None:
    result = normalize_close_prices(_raw_multiindex_frame(), ["AAPL", "MSFT", "NVDA"])
    assert "NVDA" in result.columns
    assert result["NVDA"].isna().all()


def test_normalize_empty_input_returns_expected_columns() -> None:
    result = normalize_close_prices(pd.DataFrame(), ["AAPL", "MSFT"])
    assert result.empty
    assert list(result.columns) == ["AAPL", "MSFT"]


def test_normalize_none_input_returns_expected_columns() -> None:
    result = normalize_close_prices(None, ["AAPL"])
    assert result.empty
    assert list(result.columns) == ["AAPL"]


def test_normalize_handles_flat_single_ticker_frame() -> None:
    # A single-ticker download can come back as a flat OHLC frame.
    index = pd.to_datetime(["2024-01-02", "2024-01-03"])
    flat = pd.DataFrame({"Open": [184.0, 185.5], "Close": [185.0, 186.0]}, index=index)
    result = normalize_close_prices(flat, ["AAPL"])

    assert list(result.columns) == ["AAPL"]
    assert result.loc["2024-01-02", "AAPL"] == 185.0


def test_normalize_flat_frame_without_close_is_empty() -> None:
    flat = pd.DataFrame({"Open": [1.0]}, index=pd.to_datetime(["2024-01-02"]))
    result = normalize_close_prices(flat, ["AAPL"])
    assert result.empty
    assert list(result.columns) == ["AAPL"]


def test_normalize_multiindex_without_close_is_empty() -> None:
    index = pd.to_datetime(["2024-01-02"])
    columns = pd.MultiIndex.from_tuples([("Open", "AAPL")])
    frame = pd.DataFrame([[184.0]], index=index, columns=columns)
    result = normalize_close_prices(frame, ["AAPL"])
    assert result.empty


def test_fetch_wraps_provider_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(*_args: object, **_kwargs: object) -> pd.DataFrame:
        raise ConnectionError("yahoo is down")

    monkeypatch.setattr(fetcher, "_download_prices", boom)

    with pytest.raises(DataFetchError):
        fetch_close_prices(["AAPL"], date(2024, 1, 1), date(2024, 1, 5))


def test_fetch_normalises_provider_output(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(fetcher, "_download_prices", lambda *_a, **_k: _raw_multiindex_frame())

    result = fetch_close_prices(["AAPL", "MSFT"], date(2024, 1, 2), date(2024, 1, 4))
    assert list(result.columns) == ["AAPL", "MSFT"]
    assert len(result) == 2
