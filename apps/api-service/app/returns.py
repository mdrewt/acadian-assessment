# Daily-return math, kept free of I/O so it's easy to test with small frames.
# A daily return is the close-over-previous-close change: r_t = (close_t - close_{t-1}) / close_{t-1}
# The first trading day in a window gets its return from a prior close, which the service fetches as a short lookback;
# build_returns_payload then trims back tothe requested [start, end].

from __future__ import annotations

from collections.abc import Sequence
from datetime import date

import pandas as pd

from .schemas import ReturnPoint

# Round to 6 decimals, plenty of precision without noisy floating-point tails.
_ROUND_DECIMALS = 6


def compute_daily_returns(close_prices: pd.DataFrame) -> pd.DataFrame:
    """Day-over-day fractional change of each ticker's close.

    The first row is NaN (no prior close) and gets dropped downstream.
    """
    return close_prices.sort_index().pct_change(fill_method=None)


# Trim returns to [start, end] and shape the response.
# Days without a return (leading NaN or missing data) are left out of a ticker's series, but every requested ticker is still present as a key.
def build_returns_payload(
    returns: pd.DataFrame,
    start: date,
    end: date,
    tickers: Sequence[str],
) -> dict[str, list[ReturnPoint]]:
    # Nothing came back: every ticker maps to an empty series. This also avoids comparing an empty, non-datetime index against a Timestamp below.
    if returns.empty:
        return {ticker: [] for ticker in tickers}

    window = returns.loc[
        (returns.index >= pd.Timestamp(start)) & (returns.index <= pd.Timestamp(end))
    ]

    payload: dict[str, list[ReturnPoint]] = {}
    for ticker in tickers:
        points: list[ReturnPoint] = []
        if ticker in window.columns:
            series = window[ticker].dropna()
            points = [
                ReturnPoint(
                    date=timestamp.date(),
                    daily_return=round(float(value), _ROUND_DECIMALS),
                )
                for timestamp, value in series.items()
            ]
        payload[ticker] = points
    return payload
