"""Guardian schemas."""
from __future__ import annotations

import re

from pydantic import BaseModel, field_validator


class Guardian(BaseModel):
    id: str
    name: str
    relation: str  # Family|Friend|Colleague|Other
    kind: str  # personal|official
    battery_pct: int | None = None
    status_text: str = ""
    location_shared: bool = True
    priority_link: bool = False


class GuardianAddRequest(BaseModel):
    name: str
    relation: str
    phone: str

    @field_validator("name")
    @classmethod
    def name_length(cls, v: str) -> str:
        v = v.strip()
        if not 1 <= len(v) <= 40:
            raise ValueError("Name must be 1-40 characters")
        return v

    @field_validator("relation")
    @classmethod
    def valid_relation(cls, v: str) -> str:
        allowed = {"Family", "Friend", "Colleague", "Other"}
        if v not in allowed:
            raise ValueError(f"Relation must be one of {allowed}")
        return v

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, v: str) -> str:
        if not re.match(r"^\d{7,15}$", v):
            raise ValueError("Phone must be 7-15 digits")
        return v


class EmergencyLine(BaseModel):
    name: str
    tel: str
    tag: str  # DIRECT, etc.


class ImmediateHaven(BaseModel):
    id: str
    name: str
    distance_m: int
    walk_min: int
    direction: str
    phone: str | None = None


class ProtectionState(BaseModel):
    state: str = "active"
    title: str = "Active Trip Protection"
    subtitle: str = "Live GPS & Guardian Sharing Active"


class GuardiansResponse(BaseModel):
    trip_id: str = "482"
    protection: ProtectionState = ProtectionState()
    grace_s: int = 5
    silent_escort: dict = {"enabled": False, "interval_s": 120}
    guardians: list[Guardian] = []
    active_count: int = 0
    immediate_haven: ImmediateHaven | None = None
    emergency_lines: list[EmergencyLine] = []
