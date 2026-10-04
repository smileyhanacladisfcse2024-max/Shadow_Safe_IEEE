"""Journey snapshot schemas."""
from __future__ import annotations

from pydantic import BaseModel

from .common import Segment


class TripInfo(BaseModel):
    line_label: str = "Bus 14R · Toward Downtown Central"
    line_short: str = "14R"
    status_chip: str = "Transit Monitored"
    origin: str = "Montgomery St Metro"
    destination: str = "Oakland Tech District"
    eta_minutes: int = 14
    eta_clock: str = ""
    distance_km: float = 3.4
    lighting_lux: float = 15
    lighting_label: str = "Low (15 lx)"
    crowd_label: str = "Moderate"


class VehicleInfo(BaseModel):
    x_m: float = 0.0
    y_m: float = 0.0
    speed_kmh: float = 18
    heading: str = "N"
    idle_s: float = 0


class CorridorInfo(BaseModel):
    deviation_m: float = 220
    divergence_point: dict[str, float] = {"x_m": 0.0, "y_m": 0.0}
    street_label: str = "7th St"


class RiskSummary(BaseModel):
    score: int = 38
    band: str = "moderate"
    badge: str = "Moderate Concern"
    headline: str = "Route Deviation"
    explanation: list[Segment] = []


class AlertInfo(BaseModel):
    id: str = ""
    severity: str = "warning"
    message: list[Segment] = []
    dismissed: bool = False


class GuardiansSummary(BaseModel):
    connected: int = 2
    names: list[str] = []
    status: str = "Protected"
    sharing_text: str = "Sharing live GPS location & bus status"


class HavenNearbyItem(BaseModel):
    id: str
    name: str
    icon: str
    distance_m: int
    note: str
    x_m: float
    y_m: float


class HavensNearbySummary(BaseModel):
    count_within_500m: int = 0
    items: list[HavenNearbyItem] = []


class SensorsInfo(BaseModel):
    gps_accuracy_m: float = 1.2
    cell_signal: str = "lte"
    audio_anomaly: int = 0


class SOSSummary(BaseModel):
    state: str = "idle"


class JourneySnapshot(BaseModel):
    trip_id: str = "482"
    session_id: str = "SS-2026-WIE-489"
    stage: int = 2
    evaluated_at: str = ""
    trip: TripInfo = TripInfo()
    vehicle: VehicleInfo = VehicleInfo()
    corridor: CorridorInfo = CorridorInfo()
    risk: RiskSummary = RiskSummary()
    alert: AlertInfo | None = None
    guardians: GuardiansSummary = GuardiansSummary()
    havens_nearby: HavensNearbySummary = HavensNearbySummary()
    sensors: SensorsInfo = SensorsInfo()
    sos: SOSSummary = SOSSummary()
