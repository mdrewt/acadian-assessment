# A wrapper around yfinance that fetches and normalises adjusted close prices for a list of tickers over a date range.

from __future__ import annotations

from collections.abc import Sequence
from datetime import date

import pandas as pd
import yfinance as yf

from .config import get_settings
from .exceptions import DataFetchError


# The only function here that hits the network. yfinance treats `end` as exclusive, and callers already pass an exclusive end date.
# auto_adjust=True gives split/dividend-adjusted closes, which is the right basis for returns.
def _download_prices(tickers: Sequence[str], start: date, end: date) -> pd.DataFrame:
    settings = get_settings()
    return yf.download(
        tickers=list(tickers),
        start=start.isoformat(),
        end=end.isoformat(),
        auto_adjust=True,
        actions=False,
        group_by="column",
        progress=False,
        threads=True,
        timeout=settings.fetch_timeout_seconds,
    )


# Reduce yfinance's raw frame to a wide close-price frame.
def normalize_close_prices(raw: pd.DataFrame | None, tickers: Sequence[str]) -> pd.DataFrame:
    columns = list(tickers)
    if raw is None or raw.empty:
        return pd.DataFrame(columns=columns, index=pd.DatetimeIndex([]), dtype="float64")

    # With group_by="column" the columns are a (field, ticker) MultiIndex, but a
    # single-ticker download can come back as a flat frame with a "Close" column.
    # Handle both.
    if isinstance(raw.columns, pd.MultiIndex):
        if "Close" not in raw.columns.get_level_values(0):
            return pd.DataFrame(columns=columns, index=pd.DatetimeIndex([]), dtype="float64")
        close = raw["Close"].copy()
    else:
        if "Close" not in raw.columns:
            return pd.DataFrame(columns=columns, index=pd.DatetimeIndex([]), dtype="float64")
        close = raw[["Close"]].copy()
        close.columns = [columns[0]] if len(columns) == 1 else close.columns

    # Guarantee every requested ticker is present and columns are ordered.
    close = close.reindex(columns=columns)

    # Normalise the index to tz-naive dates at midnight for stable slicing.
    close.index = pd.to_datetime(close.index).tz_localize(None).normalize()
    close = close.sort_index()
    return close.astype("float64")


# Fetch and normalise adjusted close prices.
# Any upstream error is wrapped in DataFetchError so the API returns a 502 instead of leaking a provider-specific exception.
def fetch_close_prices(tickers: Sequence[str], start: date, end: date) -> pd.DataFrame:
    try:
        raw = _download_prices(tickers, start, end)
    except Exception as exc:
        raise DataFetchError("Failed to fetch market data from the upstream provider.") from exc
    return normalize_close_prices(raw, tickers)
