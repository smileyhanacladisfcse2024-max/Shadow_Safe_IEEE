"""Demo clock service — simulated clock starting at DEMO_CLOCK_START."""
from __future__ import annotations

import time
from datetime import datetime, timedelta

from app.config import settings

_boot_real: float = 0.0
_boot_sim: datetime | None = None


def init_clock() -> None:
    global _boot_real, _boot_sim
    _boot_real = time.monotonic()
    start = settings.demo_clock_start
    if start.lower() == "real":
        _boot_sim = None
    else:
        parts = start.split(":")
        h, m = int(parts[0]), int(parts[1])
        now = datetime.now()
        _boot_sim = now.replace(hour=h, minute=m, second=0, microsecond=0)


def now() -> datetime:
    """Return the current simulated time."""
    if _boot_sim is None:
        return datetime.now()
    elapsed = time.monotonic() - _boot_real
    return _boot_sim + timedelta(seconds=elapsed)


def now_iso() -> str:
    return now().isoformat(timespec="seconds")


def eta_clock(minutes: int) -> str:
    t = now() + timedelta(minutes=minutes)
    return t.strftime("%H:%M")


def uptime_s() -> float:
    return round(time.monotonic() - _boot_real, 1)
