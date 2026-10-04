"""Haven schemas."""
from __future__ import annotations

from pydantic import BaseModel


class HavenCapability(BaseModel):
    icon: str
    label: str


class Haven(BaseModel):
    id: str
    name: str
    address: str
    icon: str
    tags: list[str]
    x_m: float
    y_m: float
    hours: str = "24/7"
    closes_at: str | None = None
    cctv_cameras: int | None = None
    lux: int | None = None
    capabilities: list[HavenCapability] = []
    phone: str | None = None
    direction: str = ""
    distance_m: int = 0
    walk_min: int = 0
    note: str = ""


class HavenMesh(BaseModel):
    label: str = "Sanctuary Mesh v2.4 Active"
    nodes_in_range: int = 5


class FilterCounts(BaseModel):
    all: int = 5
    staffed: int = 3
    transit: int = 1
    medical: int = 2
    beacon: int = 4


class HavenSpotlight(BaseModel):
    id: str
    name: str
    address: str
    distance_m: int
    walk_min: int
    direction: str
    tags: list[str]
    cctv_cameras: int | None = None
    lux: int | None = None
    capabilities: list[HavenCapability] = []
    phone: str | None = None
    note: str = ""


class HavensResponse(BaseModel):
    mesh: HavenMesh
    counts: FilterCounts
    filter: str = "all"
    spotlight: HavenSpotlight
    items: list[Haven]


class HavenActionResponse(BaseModel):
    message: str
    haven_id: str
    extra: dict | None = None
