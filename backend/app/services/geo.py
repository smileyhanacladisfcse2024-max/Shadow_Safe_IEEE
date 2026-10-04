"""Planar geometry helpers (Euclidean, meters)."""
from __future__ import annotations

import math

# The scheduled transit corridor is the vertical line x = -220
CORRIDOR_X = -220.0


def euclidean(p1: tuple[float, float], p2: tuple[float, float]) -> float:
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def corridor_deviation(x: float) -> float:
    """Distance in meters from the corridor line x = -220."""
    return abs(x - CORRIDOR_X)
