"""Share live route router."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException, Request

from app.services import clock
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["share"])


@router.post("/share/live-route")
async def share_live_route():
    async with app_state.lock:
        link = app_state.add_share_link()
        return {
            "url": link["url"],
            "token": link["token"],
            "passcode": link["passcode"],
            "expires_at": link["expires_at"],
        }


@router.get("/share/{token}")
async def get_shared_route(token: str, request: Request):
    passcode = request.headers.get("X-Passcode", "")
    async with app_state.lock:
        link = app_state.get_share_link(token)
        if not link:
            raise HTTPException(status_code=404, detail="Share link not found")

        # Check expiry
        expires = datetime.fromisoformat(link["expires_at"])
        if clock.now() > expires:
            raise HTTPException(status_code=410, detail="Share link expired")

        if passcode != link["passcode"]:
            raise HTTPException(status_code=401, detail="Invalid passcode")

        # Return read-only status with fuzzy offset
        s = app_state.get_stage_inputs()
        pos = app_state.apply_fuzzy_offset(s["position"])
        return {
            "trip_id": app_state.trip_id,
            "position": {"x_m": round(pos[0], 1), "y_m": round(pos[1], 1)},
            "risk_score": app_state._latest_score["score"] if app_state._latest_score else 0,
            "band": app_state._latest_score["band"] if app_state._latest_score else "safe",
            "heading": s["heading"],
            "timestamp": app_state.evaluated_at,
        }
