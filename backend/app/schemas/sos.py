"""SOS schemas."""
from __future__ import annotations

from pydantic import BaseModel


class SOSStatus(BaseModel):
    state: str  # idle|armed|dispatched
    deadline_at: str | None = None
    server_time: str | None = None
    grace_s: int | None = None


class SOSArmResponse(BaseModel):
    state: str = "armed"
    deadline_at: str = ""
    server_time: str = ""
    grace_s: int = 5
