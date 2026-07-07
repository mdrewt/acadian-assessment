"""Tests for the returns cache: hits, expiry, and eviction."""

from __future__ import annotations

from datetime import date

import pytest
from app.cache import ReturnsCache

from .conftest import FakeClock

R1 = (date(2024, 1, 1), date(2024, 1, 31))
R2 = (date(2024, 2, 1), date(2024, 2, 29))
R3 = (date(2024, 3, 1), date(2024, 3, 31))


def test_get_returns_stored_value_within_ttl() -> None:
    clock = FakeClock()
    cache = ReturnsCache(clock=clock)

    cache.set(R1, {"AAPL": []}, ttl_seconds=100)
    clock.advance(99)

    assert cache.get(R1) == {"AAPL": []}


def test_entry_expires_after_ttl() -> None:
    clock = FakeClock()
    cache = ReturnsCache(clock=clock)
    cache.set(R1, {"AAPL": []}, ttl_seconds=100)

    clock.advance(100)  # expiry is inclusive: expires_at <= now counts as a miss
    assert cache.get(R1) is None


def test_expired_entry_is_dropped_on_read() -> None:
    clock = FakeClock()
    cache = ReturnsCache(clock=clock)
    cache.set(R1, {"AAPL": []}, ttl_seconds=10)

    clock.advance(20)
    cache.get(R1)

    assert len(cache) == 0


def test_missing_key_is_a_miss() -> None:
    cache = ReturnsCache()
    assert cache.get(R1) is None


def test_capacity_eviction_drops_soonest_to_expire() -> None:
    clock = FakeClock()
    cache = ReturnsCache(max_entries=2, clock=clock)

    cache.set(R1, {"a": []}, ttl_seconds=10)  # expires first
    cache.set(R2, {"b": []}, ttl_seconds=1000)
    cache.set(R3, {"c": []}, ttl_seconds=500)  # third insert forces an eviction

    assert cache.get(R1) is None
    assert cache.get(R2) == {"b": []}
    assert cache.get(R3) == {"c": []}


def test_set_sweeps_already_expired_entries() -> None:
    clock = FakeClock()
    cache = ReturnsCache(max_entries=10, clock=clock)
    cache.set(R1, {"a": []}, ttl_seconds=10)

    clock.advance(20)  # R1 is expired but still resident
    cache.set(R2, {"b": []}, ttl_seconds=10)  # writing sweeps it out first

    assert len(cache) == 1
    assert cache.get(R2) == {"b": []}


def test_clear_empties_the_cache() -> None:
    cache = ReturnsCache()
    cache.set(R1, {"a": []}, ttl_seconds=100)
    cache.clear()
    assert cache.get(R1) is None
    assert len(cache) == 0


def test_set_rejects_nonpositive_ttl() -> None:
    cache = ReturnsCache()
    with pytest.raises(ValueError):
        cache.set(R1, {"a": []}, ttl_seconds=0)


def test_constructor_rejects_bad_capacity() -> None:
    with pytest.raises(ValueError):
        ReturnsCache(max_entries=0)
