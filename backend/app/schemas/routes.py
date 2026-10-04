"""Route schemas."""
from __future__ import annotations

from pydantic import BaseModel


class RouteChip(BaseModel):
    icon: str
    label: str


class RouteMetric(BaseModel):
    label: str
    detail: str


class RouteOption(BaseModel):
    id: str
    name: str
    tag: str = ""
    description: str
    time_min: int
    time_delta: str = ""
    concern: int
    chips: list[RouteChip]
    metrics: list[RouteMetric]
    selected: bool = False


class AutoReroute(BaseModel):
    enabled: bool = True
    threshold: int = 50
    standing_by: bool = False


class RoutesResponse(BaseModel):
    headline: str = "Dynamic Corridor Reroute"
    subtitle: str = ""
    options: list[RouteOption]
    selected_route_id: str = "b"
    auto_reroute: AutoReroute = AutoReroute()


class RouteSelectRequest(BaseModel):
    route_id: str


class AutoRerouteRequest(BaseModel):
    enabled: bool


class RouteAcceptRequest(BaseModel):
    route_id: str


class RouteAcceptResponse(BaseModel):
    message: str
    journey: dict | None = None


class SimulateRerouteResponse(BaseModel):
    message: str
    preview_route_id: str
    predicted_score: int
