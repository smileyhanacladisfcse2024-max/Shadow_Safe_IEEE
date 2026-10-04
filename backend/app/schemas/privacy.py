"""Privacy schemas."""
from __future__ import annotations

from pydantic import BaseModel


class PolicyItem(BaseModel):
    id: str
    title: str
    description: str
    enabled: bool = True


class ComplianceBadge(BaseModel):
    icon: str
    label: str


class PrivacyResponse(BaseModel):
    session_id: str = "SS-2026-WIE-489"
    storage: str = "RAM_ONLY"
    cipher: str = "AES-GCM-256"
    bytes_held: int = 0
    policies: list[PolicyItem] = []
    compliance_badges: list[ComplianceBadge] = []


class PolicyUpdateRequest(BaseModel):
    enabled: bool


class PurgeResponse(BaseModel):
    purged: bool = True
    bytes_held: int = 0
    cleared: dict = {}
