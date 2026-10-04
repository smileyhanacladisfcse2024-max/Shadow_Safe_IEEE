"""Risk scoring schemas."""
from __future__ import annotations

from pydantic import BaseModel

from .common import Segment


class ScoringInputs(BaseModel):
    position: tuple[float, float] = (0.0, 0.0)
    dev_m: float = 0.0
    idle_s: float = 0
    advisories_verified: int = 0
    commuter_pings: int = 0
    lux: float = 0
    crowd: str = "moderate"  # dense|moderate|sparse|empty
    cell: str = "lte"  # lte|degraded|none
    audio_anomaly: int = 0  # 0-8
    grid_outage: bool = False


class FactorResult(BaseModel):
    id: str
    points: int
    max_points: int
    confidence_pct: int
    trace: str


class CorridorDetail(BaseModel):
    current_label: str
    delta_label: str


class DwellDetail(BaseModel):
    dot_congestion_pct: int
    scheduled_stops: int
    speed_kmh: float
    accuracy_m: float


class AdvisoryDetail(BaseModel):
    source: str
    age_min: int
    corroboration_label: str


class EnvironmentQuadrant(BaseModel):
    id: str
    label: str
    value: str
    sublabel: str


class EnvironmentDetail(BaseModel):
    quadrants: list[EnvironmentQuadrant]


class FactorCard(BaseModel):
    id: str
    title: str
    subtitle: str
    icon: str
    points: int
    impact_label: str
    narrative: list[Segment]
    confidence_pct: int
    trace: str
    corridor: CorridorDetail | None = None
    dwell: DwellDetail | None = None
    advisory: AdvisoryDetail | None = None
    environment: EnvironmentDetail | None = None


class Driver(BaseModel):
    id: str
    label: str
    points: int
    share_pct: float


class NearestHaven(BaseModel):
    id: str
    name: str
    distance_m: int
    direction: str
    note: str


class EngineInfo(BaseModel):
    label: str = "FastAPI Scoring Engine"
    version: str = "v2.4.2"
    evaluated_at: str = ""


class RiskReport(BaseModel):
    engine: EngineInfo
    score: int
    band: str
    label: str
    safe_threshold: int = 20
    disclaimer: str
    weights: dict[str, int]
    drivers: list[Driver]
    factors: list[FactorCard]
    nearest_haven: NearestHaven


class ScoringResult(BaseModel):
    """Internal result from the scoring engine."""
    score: int
    band: str
    badge: str
    corridor_pts: int
    dwell_pts: int
    advisory_pts: int
    environment_pts: int
    corridor_confidence: int
    dwell_confidence: int
    advisory_confidence: int
    environment_confidence: int
    lighting_pct: int
