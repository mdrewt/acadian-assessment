"""End-to-end HTTP tests for the API using FastAPI's TestClient.

The service's fetch seam is overridden so no network calls are made, while the
full request/response/validation/error path is exercised for real.
"""

from __future__ import annotations

from collections.abc import Callable, Iterator
from datetime import date

import pandas as pd
import pytest
from app.config import Settings
from app.dependencies import get_returns_service
from app.exceptions import DataFetchError
from app.main import create_app
from app.service import ReturnsService
from fastapi.testclient import TestClient

from .conftest import RecordingFetcher, make_close_frame

PRICES = make_close_frame(
    {
        "AAPL": {"2024-01-09": 100.0, "2024-01-10": 101.0, "2024-01-11": 102.01},
        "MSFT": {"2024-01-09": 200.0, "2024-01-10": 202.0, "2024-01-11": 204.02},
    }
)

SETTINGS = Settings(tickers=("AAPL", "MSFT"))


def _client(fetch_fn: Callable) -> Iterator[TestClient]:
    app = create_app(SETTINGS)
    service = ReturnsService(SETTINGS, fetch_fn=fetch_fn, today_fn=lambda: date(2024, 6, 1))
    app.dependency_overrides[get_returns_service] = lambda: service
    with TestClient(app) as client:
        yield client


@pytest.fixture
def client() -> Iterator[TestClient]:
    yield from _client(RecordingFetcher(PRICES))


def test_returns_happy_path(client: TestClient) -> None:
    resp = client.get("/returns", params={"start": "2024-01-10", "end": "2024-01-11"})

    assert resp.status_code == 200
    body = resp.json()
    assert set(body) == {"AAPL", "MSFT"}
    # Exact spec shape: list of {"date", "return"} objects.
    assert body["AAPL"][0] == {"date": "2024-01-10", "return": 0.01}


def test_returns_missing_params_is_422(client: TestClient) -> None:
    assert client.get("/returns").status_code == 422


def test_returns_malformed_date_is_422(client: TestClient) -> None:
    resp = client.get("/returns", params={"start": "01-2024-10", "end": "2024-01-11"})
    assert resp.status_code == 422


def test_returns_start_after_end_is_400(client: TestClient) -> None:
    resp = client.get("/returns", params={"start": "2024-01-11", "end": "2024-01-10"})
    assert resp.status_code == 400
    assert "start" in resp.json()["detail"].lower()


def test_returns_empty_data_yields_empty_arrays() -> None:
    empty = pd.DataFrame(columns=["AAPL", "MSFT"], dtype="float64")
    client = next(_client(lambda *_a, **_k: empty))
    resp = client.get("/returns", params={"start": "2024-01-10", "end": "2024-01-11"})

    assert resp.status_code == 200
    assert resp.json() == {"AAPL": [], "MSFT": []}


def test_returns_upstream_failure_is_502() -> None:
    def boom(*_a: object, **_k: object) -> pd.DataFrame:
        raise DataFetchError("upstream down")

    client = next(_client(boom))
    resp = client.get("/returns", params={"start": "2024-01-10", "end": "2024-01-11"})

    assert resp.status_code == 502
    assert "detail" in resp.json()


def test_returns_through_real_wiring(monkeypatch: pytest.MonkeyPatch) -> None:
    """Exercise the true production path (lifespan-built service + real fetch
    pipeline) with only the network boundary mocked."""
    from app import fetcher

    index = pd.to_datetime(["2024-01-09", "2024-01-10", "2024-01-11"])
    columns = pd.MultiIndex.from_tuples([("Close", "AAPL"), ("Close", "MSFT")])
    raw = pd.DataFrame(
        [[100.0, 200.0], [101.0, 202.0], [102.01, 204.02]], index=index, columns=columns
    )
    monkeypatch.setattr(fetcher, "_download_prices", lambda *_a, **_k: raw)

    # No dependency override: the app's lifespan builds the real ReturnsService.
    with TestClient(create_app(SETTINGS)) as client:
        resp = client.get("/returns", params={"start": "2024-01-10", "end": "2024-01-11"})

    assert resp.status_code == 200
    assert resp.json()["AAPL"][0] == {"date": "2024-01-10", "return": 0.01}
