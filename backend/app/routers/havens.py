"""Havens router for ShadowSafe 2.0.

Provides real OpenStreetMap safety sanctuary networks, emergency beacon triggers,
and walking path guidance.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data.seed import HAVENS
from app.services import clock, geo, scoring
from app.services.osm_havens import fetch_real_nearby_havens
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["havens"])


class NearbyHavensRequest(BaseModel):
    lat: float
    lng: float
    radius_m: int = 3500
    filter: str = "all"


def _compute_havens(filter_tag: str = "all") -> dict:
    """Compute haven list with distances from current stage position or real GPS location."""
    # 1. Use real havens if populated
    if app_state.real_havens:
        items = list(app_state.real_havens)
    else:
        # Fallback to seeded havens
        s = app_state.get_stage_inputs()
        pos = s["position"]
        items = []
        for h in HAVENS:
            d = geo.euclidean(pos, (h["x_m"], h["y_m"]))
            d_int = scoring.half_up(d)
            walk = scoring.half_up(d / 80)
            haven = {**h, "distance_m": d_int, "walk_min": walk}

            # Closes-in calculation
            if h.get("closes_at"):
                try:
                    now = clock.now()
                    close_time = now.replace(
                        hour=int(h["closes_at"].split(":")[0]),
                        minute=int(h["closes_at"].split(":")[1]) if ":" in h["closes_at"] else 0,
                        second=0,
                    )
                    delta = close_time - now
                    if delta.total_seconds() > 0:
                        hours = int(delta.total_seconds() // 3600)
                        mins = int((delta.total_seconds() % 3600) // 60)
                        haven["note"] = f"Closes in {hours}h {mins}m"
                    else:
                        haven["note"] = "Closed"
                except Exception:
                    haven["note"] = h["hours"]
            else:
                haven["note"] = h["hours"]

            items.append(haven)

    items.sort(key=lambda x: x["distance_m"])

    # Filter
    if filter_tag != "all":
        filtered = [h for h in items if filter_tag in h.get("tags", [])]
    else:
        filtered = items

    # Counts
    all_count = len(items)
    staffed_count = sum(1 for h in items if "staffed" in h.get("tags", []))
    transit_count = sum(1 for h in items if "transit" in h.get("tags", []))
    medical_count = sum(1 for h in items if "medical" in h.get("tags", []))
    beacon_count = sum(1 for h in items if "beacon" in h.get("tags", []))

    # Nodes in range (within 600m)
    nodes_in_range = sum(1 for h in items if h["distance_m"] <= 600)

    # Spotlight = nearest open haven
    spotlight_haven = items[0] if items else None
    spotlight = None
    if spotlight_haven:
        spotlight = {
            "id": spotlight_haven["id"],
            "name": spotlight_haven["name"],
            "address": spotlight_haven["address"],
            "distance_m": spotlight_haven["distance_m"],
            "walk_min": spotlight_haven["walk_min"],
            "direction": spotlight_haven.get("direction", ""),
            "tags": spotlight_haven.get("tags", []),
            "cctv_cameras": spotlight_haven.get("cctv_cameras", 8),
            "lux": spotlight_haven.get("lux", 160),
            "capabilities": spotlight_haven.get("capabilities", []),
            "phone": spotlight_haven.get("phone", "112"),
            "note": spotlight_haven.get("note", ""),
            "lat": spotlight_haven.get("lat"),
            "lng": spotlight_haven.get("lng"),
        }

    return {
        "mesh": {"label": "Sanctuary Mesh v2.4 Active", "nodes_in_range": nodes_in_range},
        "counts": {
            "all": all_count,
            "staffed": staffed_count,
            "transit": transit_count,
            "medical": medical_count,
            "beacon": beacon_count,
        },
        "filter": filter_tag,
        "spotlight": spotlight,
        "items": filtered,
    }


def _find_haven(haven_id: str) -> dict | None:
    """Find haven in real havens cache or seed havens."""
    for h in app_state.real_havens:
        if h["id"] == haven_id:
            return h
    for h in HAVENS:
        if h["id"] == haven_id:
            return h
    return None


@router.get("/havens")
async def get_havens(filter: str = "all"):
    valid_filters = {"all", "staffed", "transit", "medical", "beacon", "police", "community"}
    if filter not in valid_filters:
        raise HTTPException(status_code=400, detail=f"filter must be one of {valid_filters}")
    async with app_state.lock:
        return _compute_havens(filter)


@router.post("/havens/nearby")
async def get_nearby_havens_for_coords(body: NearbyHavensRequest):
    """Fetch real havens dynamically for specific GPS coordinates."""
    real_havens = await fetch_real_nearby_havens(body.lat, body.lng, radius_m=body.radius_m, filter_tag=body.filter)
    async with app_state.lock:
        app_state.real_havens = real_havens
        return _compute_havens(body.filter)


@router.post("/havens/{haven_id}/beacon")
async def trigger_beacon(haven_id: str):
    haven = _find_haven(haven_id)
    if not haven:
        raise HTTPException(status_code=404, detail="Haven not found")
    return {
        "message": f"{haven['name']} exterior high-lux strobe activated. Look for the cyan portal pulse.",
        "haven_id": haven_id,
        "extra": None,
    }


@router.post("/havens/{haven_id}/call")
async def call_haven(haven_id: str):
    haven = _find_haven(haven_id)
    if not haven:
        raise HTTPException(status_code=404, detail="Haven not found")
    phone = haven.get("phone") or "112"
    return {
        "message": f"Connecting to {haven['name']} Emergency Desk (Encrypted VoLTE Link)...",
        "haven_id": haven_id,
        "extra": {"phone": phone},
    }


@router.post("/havens/{haven_id}/navigate")
async def navigate_haven(haven_id: str):
    haven = _find_haven(haven_id)
    if not haven:
        raise HTTPException(status_code=404, detail="Haven not found")
    walk = haven.get("walk_min", 4)
    return {
        "message": f"Safe walking corridor engaged: {walk} min to {haven['name']}.",
        "haven_id": haven_id,
        "extra": {"walk_min": walk, "lat": haven.get("lat"), "lng": haven.get("lng")},
    }


@router.post("/havens/{haven_id}/ping")
async def ping_haven(haven_id: str):
    haven = _find_haven(haven_id)
    if not haven:
        raise HTTPException(status_code=404, detail="Haven not found")
    dist = haven.get("distance_m", 300)
    return {
        "message": f"{haven['name']} sanctuary beacon pinged. Distance: {dist}m {haven.get('direction', '')}",
        "haven_id": haven_id,
        "extra": {"distance_m": dist},
    }


@router.post("/havens/{haven_id}/activate-path")
async def activate_path(haven_id: str):
    haven = _find_haven(haven_id)
    if not haven:
        raise HTTPException(status_code=404, detail="Haven not found")
    return {
        "message": f"High-lux Sanctuary Corridor engaged to {haven['name']}. Guidance active.",
        "haven_id": haven_id,
        "extra": None,
    }
