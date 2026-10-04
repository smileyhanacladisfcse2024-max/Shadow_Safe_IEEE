"""Health router."""
from __future__ import annotations

from fastapi import APIRouter

from app.services.clock import uptime_s
from app.services.scoring import ENGINE_VERSION

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "engine_version": ENGINE_VERSION,
        "uptime_s": uptime_s(),
    }
