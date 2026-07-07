# Small in-memory cache for computed return payloads.
#
# Results are keyed by the requested (start, end) range. A range that has already ended is cached for a day; a range that still includes today only lives
# for a few minutes, since those prices are still moving. Entries expire on read, and when the cache is full the entry that expires soonest is dropped.
#
# The clock is passed in so the expiry logic can be tested without waiting on real time.

from __future__ import annotations

import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date

from .schemas import ReturnsResponse

CacheKey = tuple[date, date]

@dataclass(slots=True)
class _Entry:
    value: ReturnsResponse
    expires_at: float


class ReturnsCache:
    def __init__(
        self, max_entries: int = 256, clock: Callable[[], float] = time.monotonic
    ) -> None:
        if max_entries < 1:
            raise ValueError("max_entries must be >= 1")
        self._entries: dict[CacheKey, _Entry] = {}
        self._lock = threading.Lock()
        self._max_entries = max_entries
        self._clock = clock

    def get(self, key: CacheKey) -> ReturnsResponse | None:
        with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                return None
            if entry.expires_at <= self._clock():
                del self._entries[key]  # expired; drop it on the way out
                return None
            return entry.value

    def set(self, key: CacheKey, value: ReturnsResponse, ttl_seconds: float) -> None:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        with self._lock:
            self._make_room()
            self._entries[key] = _Entry(value, self._clock() + ttl_seconds)

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()

    def __len__(self) -> int:
        with self._lock:
            return len(self._entries)

    def _make_room(self) -> None:
        # Caller holds the lock. Clear out anything expired first; if that
        # wasn't enough, drop whatever is closest to expiring.
        now = self._clock()
        expired = [key for key, entry in self._entries.items() if entry.expires_at <= now]
        for key in expired:
            del self._entries[key]
        while len(self._entries) >= self._max_entries:
            soonest = min(self._entries, key=lambda k: self._entries[k].expires_at)
            del self._entries[soonest]
