"""Routes router for ShadowSafe 2.0.

Provides dynamic corridor routing, real OSRM route calculations,
and alternate route selection with zero-cost open-source technology.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data.seed import ROUTES
from app.services.osm_routing import build_route_options
from app.services.osm_havens import fetch_real_nearby_havens
from app.services.scenarios import STAGES
from app.services.sse import sse_hub
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["routes"])


class LocationPoint(BaseModel):
    name: str
    lat: float
    lng: float


class CalculateRouteRequest(BaseModel):
    origin: LocationPoint
    destination: LocationPoint


def _build_routes_response() -> dict:
    routes_list = app_state.active_routes if app_state.active_routes else ROUTES
    selected = app_state.selected_route_id

    # Fallback to first route if selected is not present
    valid_ids = {r["id"] for r in routes_list}
    if selected not in valid_ids and routes_list:
        selected = routes_list[0]["id"]
        app_state.selected_route_id = selected

    current_concern = next((r.get("concern", 12) for r in routes_list if r["id"] == selected), 12)
    safer_count = sum(1 for r in routes_list if r.get("concern", 12) < current_concern)

    options = []
    for r in routes_list:
        options.append({
            **r,
            "selected": r["id"] == selected,
        })

    return {
        "headline": "Dynamic Corridor Reroute",
        "subtitle": f"OpenStreetMap & OSRM Engine evaluated {len(routes_list)} verified routes ({safer_count} safer alternatives)",
        "options": options,
        "selected_route_id": selected,
        "auto_reroute": {
            "enabled": app_state.auto_reroute_enabled,
            "threshold": 50,
            "standing_by": app_state.auto_reroute_standing_by,
        },
    }


@router.get("/routes")
async def get_routes():
    async with app_state.lock:
        return _build_routes_response()


@router.post("/routes/calculate")
async def calculate_routes(body: CalculateRouteRequest):
    """Calculate real OSRM driving/walking routes and nearby safe havens between two locations."""
    origin = body.origin
    dest = body.destination

    # 1. Build real route options with OSRM
    routes = await build_route_options(
        origin_name=origin.name,
        origin_lat=origin.lat,
        origin_lng=origin.lng,
        dest_name=dest.name,
        dest_lat=dest.lat,
        dest_lng=dest.lng,
    )

    # 2. Pick primary recommended route (Route B or first route)
    primary_route = next((r for r in routes if r["id"] == "b"), routes[0])

    # 3. Fetch real nearby havens along route
    mid_lat = (origin.lat + dest.lat) / 2.0
    mid_lng = (origin.lng + dest.lng) / 2.0
    real_havens = await fetch_real_nearby_havens(mid_lat, mid_lng)

    async with app_state.lock:
        app_state.active_routes = routes
        app_state.real_havens = real_havens
        app_state.selected_route_id = primary_route["id"]

        # Update custom corridor in state store
        app_state.custom_corridor = {
            "origin": origin.name,
            "destination": dest.name,
            "origin_lat": origin.lat,
            "origin_lng": origin.lng,
            "dest_lat": dest.lat,
            "dest_lng": dest.lng,
            "distance_km": primary_route["distance_km"],
            "eta_minutes": primary_route["time_min"],
            "polyline": primary_route.get("polyline", []),
            "line_label": primary_route["name"],
            "line_short": "SAFE",
            "lighting_lux": 92,
            "lighting_label": "Well-Lit (92 lx)",
            "crowd_label": "Protected",
            "street_label": primary_route.get("name", "Active Corridor"),
            "is_real_route": True,
        }

        # Clear alert and update score to safe
        app_state.stage = 1
        app_state.alert_dismissed = False
        app_state._latest_score = None
        app_state.evaluate()
        snapshot = app_state.build_journey_snapshot()

    await sse_hub.publish("journey", snapshot)

    return {
        "message": f"Successfully calculated {len(routes)} real routes via OpenStreetMap & OSRM",
        "routes": _build_routes_response(),
        "journey": snapshot,
    }


@router.post("/routes/select")
async def select_route(body: dict):
    route_id = body.get("route_id")
    routes_list = app_state.active_routes if app_state.active_routes else ROUTES
    valid_ids = {r["id"] for r in routes_list}
    if route_id not in valid_ids:
        raise HTTPException(status_code=400, detail=f"route_id must be one of {valid_ids}")

    async with app_state.lock:
        app_state.selected_route_id = route_id
        # Update custom corridor polyline and metrics to chosen route
        chosen = next((r for r in routes_list if r["id"] == route_id), None)
        if chosen and app_state.custom_corridor:
            if "distance_km" in chosen:
                app_state.custom_corridor["distance_km"] = chosen["distance_km"]
            if "time_min" in chosen:
                app_state.custom_corridor["eta_minutes"] = chosen["time_min"]
            if "polyline" in chosen:
                app_state.custom_corridor["polyline"] = chosen["polyline"]
        return _build_routes_response()


@router.put("/routes/auto-reroute")
async def set_auto_reroute(body: dict):
    enabled = body.get("enabled")
    if not isinstance(enabled, bool):
        raise HTTPException(status_code=400, detail="enabled must be a boolean")
    async with app_state.lock:
        app_state.auto_reroute_enabled = enabled
        if not enabled:
            app_state.auto_reroute_standing_by = False
        return _build_routes_response()


@router.post("/routes/accept")
async def accept_route(body: dict):
    route_id = body.get("route_id")
    routes_list = app_state.active_routes if app_state.active_routes else ROUTES
    valid_ids = {r["id"] for r in routes_list}
    if route_id not in valid_ids:
        raise HTTPException(status_code=400, detail=f"route_id must be one of {valid_ids}")

    async with app_state.lock:
        app_state.selected_route_id = route_id
        chosen = next((r for r in routes_list if r["id"] == route_id), None)
        if chosen and app_state.custom_corridor:
            if "distance_km" in chosen:
                app_state.custom_corridor["distance_km"] = chosen["distance_km"]
            if "time_min" in chosen:
                app_state.custom_corridor["eta_minutes"] = chosen["time_min"]
            if "polyline" in chosen:
                app_state.custom_corridor["polyline"] = chosen["polyline"]

        # Reset stage to 1 (safe nominal) or 5
        app_state.stage = 1
        app_state.alert_dismissed = False
        app_state._latest_score = None
        app_state.evaluate()
        snapshot = app_state.build_journey_snapshot()

    await sse_hub.publish("journey", snapshot)
    return {"message": f"Route {route_id.upper()} accepted and corridor updated", "journey": snapshot}


@router.post("/routes/simulate-reroute")
async def simulate_reroute():
    """Preview what the score would be on route B without changing state."""
    from app.services import geo, scoring
    s5 = STAGES[5]
    dev_m = geo.corridor_deviation(s5["position"][0])
    async with app_state.lock:
        crowdsourcing_on = app_state.policies.get("anonymized_crowdsourcing", True)
    result = scoring.compute_score(
        dev_m=dev_m,
        idle_s=s5["idle_s"],
        advisories_verified=s5["advisories_verified"],
        commuter_pings=s5["commuter_pings"],
        lux=s5["lux"],
        crowd=s5["crowd"],
        cell=s5["cell"],
        audio_anomaly=s5["audio_anomaly"],
        grid_outage=s5["grid_outage"],
        crowdsourcing_on=crowdsourcing_on,
    )
    return {
        "message": "Reroute simulation complete — no state changed",
        "preview_route_id": "b",
        "predicted_score": result["score"],
    }
