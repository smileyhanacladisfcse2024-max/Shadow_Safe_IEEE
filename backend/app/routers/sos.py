"""SOS router."""
from __future__ import annotations

import asyncio
from datetime import timedelta

from fastapi import APIRouter

from app.config import settings
from app.services import clock
from app.services.sse import sse_hub
from app.services.tasks import sos_grace_timer
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["sos"])


@router.post("/sos/arm")
async def arm_sos():
    async with app_state.lock:
        if app_state.sos_state == "armed":
            # Idempotent
            deadline = (clock.now() + timedelta(seconds=settings.grace_seconds)).isoformat(timespec="seconds")
            return {
                "state": "armed",
                "deadline_at": deadline,
                "server_time": clock.now_iso(),
                "grace_s": settings.grace_seconds,
            }
        app_state.sos_state = "armed"
        deadline = (clock.now() + timedelta(seconds=settings.grace_seconds)).isoformat(timespec="seconds")
        app_state.sos_task = asyncio.create_task(sos_grace_timer())

    await sse_hub.publish("sos", {"state": "armed", "timestamp": clock.now_iso()})
    return {
        "state": "armed",
        "deadline_at": deadline,
        "server_time": clock.now_iso(),
        "grace_s": settings.grace_seconds,
    }


@router.post("/sos/cancel")
async def cancel_sos():
    async with app_state.lock:
        if app_state.sos_task and not app_state.sos_task.done():
            app_state.sos_task.cancel()
        app_state.sos_state = "idle"
        app_state.sos_task = None

    await sse_hub.publish("sos", {"state": "idle", "timestamp": clock.now_iso()})
    return {"state": "idle"}


@router.post("/sos/resolve")
async def resolve_sos():
    async with app_state.lock:
        app_state.sos_state = "idle"
        if app_state.sos_task and not app_state.sos_task.done():
            app_state.sos_task.cancel()
        app_state.sos_task = None

    await sse_hub.publish("sos", {"state": "idle", "timestamp": clock.now_iso()})
    return {"state": "idle", "message": "SOS resolved — stand down"}


@router.get("/sos/status")
async def sos_status():
    async with app_state.lock:
        return {"state": app_state.sos_state}
