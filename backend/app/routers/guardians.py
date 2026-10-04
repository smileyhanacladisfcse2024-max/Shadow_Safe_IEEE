"""Guardians router."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.config import settings
from app.data.seed import EMERGENCY_LINES, HAVENS
from app.schemas.guardians import GuardianAddRequest
from app.services import clock, geo, scoring
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["guardians"])


def _build_response() -> dict:
    guardians = app_state.guardians
    personal = [g for g in guardians if g["kind"] == "personal"]

    # Immediate haven
    s = app_state.get_stage_inputs()
    pos = s["position"]
    nearest = None
    for h in HAVENS:
        d = scoring.half_up(geo.euclidean(pos, (h["x_m"], h["y_m"])))
        walk = scoring.half_up(d / 80)
        if nearest is None or d < nearest["distance_m"]:
            nearest = {
                "id": h["id"],
                "name": h["name"],
                "distance_m": d,
                "walk_min": walk,
                "direction": h.get("direction", ""),
                "phone": h.get("phone"),
            }

    return {
        "trip_id": app_state.trip_id,
        "protection": {
            "state": "active",
            "title": "Active Trip Protection",
            "subtitle": "Live GPS & Guardian Sharing Active",
        },
        "grace_s": settings.grace_seconds,
        "silent_escort": {
            "enabled": app_state.silent_escort_enabled,
            "interval_s": settings.silent_checkin_s,
        },
        "guardians": guardians,
        "active_count": len(personal),
        "immediate_haven": nearest,
        "emergency_lines": EMERGENCY_LINES,
    }


@router.get("/guardians")
async def get_guardians():
    async with app_state.lock:
        return _build_response()


@router.post("/guardians", status_code=201)
async def add_guardian(body: GuardianAddRequest):
    async with app_state.lock:
        # Check duplicate by name
        existing = [g["name"].lower() for g in app_state.guardians]
        if body.name.strip().lower() in existing:
            raise HTTPException(status_code=409, detail="Guardian with this name already exists")
        new_guardian = {
            "id": f"guardian-{uuid.uuid4().hex[:6]}",
            "name": body.name.strip(),
            "relation": body.relation,
            "kind": "personal",
            "battery_pct": None,
            "status_text": f"Phone: {body.phone}",
            "location_shared": True,
            "priority_link": False,
        }
        app_state.guardians.append(new_guardian)
        return new_guardian


@router.delete("/guardians/{guardian_id}")
async def delete_guardian(guardian_id: str):
    async with app_state.lock:
        guardian = next((g for g in app_state.guardians if g["id"] == guardian_id), None)
        if not guardian:
            raise HTTPException(status_code=404, detail="Guardian not found")
        if guardian["kind"] == "official":
            raise HTTPException(status_code=403, detail="Official contacts cannot be deleted")
        app_state.guardians = [g for g in app_state.guardians if g["id"] != guardian_id]
        return {"message": f"Guardian {guardian['name']} removed", "id": guardian_id}


@router.put("/guardians/silent-escort")
async def set_silent_escort(body: dict):
    enabled = body.get("enabled")
    if not isinstance(enabled, bool):
        raise HTTPException(status_code=400, detail="enabled must be a boolean")
    async with app_state.lock:
        app_state.silent_escort_enabled = enabled
        return {"silent_escort": {"enabled": enabled, "interval_s": settings.silent_checkin_s}}


@router.post("/checkin/confirm")
async def confirm_checkin():
    async with app_state.lock:
        import time
        app_state.last_checkin_confirmed = time.monotonic()
        return {"message": "Check-in confirmed", "timestamp": clock.now_iso()}
