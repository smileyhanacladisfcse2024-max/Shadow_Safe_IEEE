"""Deterministic risk scoring engine v2.4.2.

Pure functions — no I/O, no state mutation. Unit-test every path.
"""
from __future__ import annotations

import math

ENGINE_VERSION = "v2.4.2"

WEIGHTS = {"corridor": 35, "dwell": 25, "advisory": 15, "environment": 25}

# --- helpers ----------------------------------------------------------------

def half_up(x: float) -> int:
    """Round-half-up (banker-safe): floor(x + 0.5)."""
    return int(math.floor(x + 0.5))


# --- sub-scores -------------------------------------------------------------

def corridor_score(dev_m: float) -> int:
    return min(35, half_up(dev_m * 0.0818))


def dwell_score(idle_s: float) -> int:
    return min(25, half_up(idle_s / 25))


def advisory_score(
    advisories_verified: int,
    commuter_pings: int,
    crowdsourcing_on: bool,
) -> int:
    pings_effective = commuter_pings if crowdsourcing_on else 0
    return min(15, 4 * advisories_verified + pings_effective)


def lighting_pct(lux: float) -> int:
    return min(100, half_up(lux / 44 * 100))


def environment_score(
    lux: float,
    crowd: str,
    cell: str,
    audio_anomaly: int,
    grid_outage: bool,
) -> int:
    L = min(1.0, lux / 44)
    lighting_pts = half_up((0.5 - L) * 20) if L < 0.5 else 0

    crowd_map = {"dense": 0, "moderate": 0, "sparse": 1, "empty": 3}
    crowd_pts = crowd_map.get(crowd, 0)

    cell_map = {"lte": 0, "degraded": 3, "none": 6}
    cell_pts = cell_map.get(cell, 0)

    outage_pts = 6 if grid_outage else 0

    return min(25, lighting_pts + crowd_pts + cell_pts + audio_anomaly + outage_pts)


# --- composite ---------------------------------------------------------------

def compute_score(
    dev_m: float,
    idle_s: float,
    advisories_verified: int,
    commuter_pings: int,
    lux: float,
    crowd: str,
    cell: str,
    audio_anomaly: int,
    grid_outage: bool,
    crowdsourcing_on: bool = True,
) -> dict:
    """Return a dict with total score, sub-scores, band, badge, lighting_pct."""
    c = corridor_score(dev_m)
    d = dwell_score(idle_s)
    a = advisory_score(advisories_verified, commuter_pings, crowdsourcing_on)
    e = environment_score(lux, crowd, cell, audio_anomaly, grid_outage)

    total = min(100, c + d + a + e)
    lp = lighting_pct(lux)

    if total < 20:
        band, badge = "safe", "Safe Nominal"
    elif total < 50:
        band, badge = "moderate", "Moderate Attention"
    elif total < 75:
        band, badge = "elevated", "Elevated Risk"
    else:
        band, badge = "critical", "Critical Alert"

    return {
        "score": total,
        "band": band,
        "badge": badge,
        "corridor_pts": c,
        "dwell_pts": d,
        "advisory_pts": a,
        "environment_pts": e,
        "corridor_confidence": 94,
        "dwell_confidence": 88,
        "advisory_confidence": 85,
        "environment_confidence": 91,
        "lighting_pct": lp,
    }
