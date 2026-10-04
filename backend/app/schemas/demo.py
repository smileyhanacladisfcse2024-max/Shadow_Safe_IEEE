"""Demo schemas."""
from __future__ import annotations

from pydantic import BaseModel


class StageInfo(BaseModel):
    id: int
    name: str
    subtitle: str
    score: int
    active: bool = False


class DemoStagesResponse(BaseModel):
    active_stage: int
    stages: list[StageInfo]


class TelemetryMockRequest(BaseModel):
    stage: int | None = None
    custom: dict | None = None


class TelemetryMockResponse(BaseModel):
    journey: dict
    risk_score: int
    band: str
    latency_ms: float


class DemoResetResponse(BaseModel):
    message: str = "Demo reset to boot state (stage 2)"
    active_stage: int = 2
