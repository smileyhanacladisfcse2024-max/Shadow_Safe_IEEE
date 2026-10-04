"""Risk breakdown router."""
from __future__ import annotations

from fastapi import APIRouter

from app.data.seed import HAVENS
from app.services import clock, geo, scoring
from app.services.narratives import (
    advisory_narrative,
    corridor_narrative,
    dwell_narrative,
    environment_narrative,
)
from app.services.scoring import ENGINE_VERSION, WEIGHTS
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["risk"])


@router.get("/risk")
async def get_risk():
    async with app_state.lock:
        s = app_state.get_stage_inputs()
        pos = s["position"]
        dev_m = geo.corridor_deviation(pos[0])

        if app_state._latest_score is None:
            app_state.evaluate()
        r = app_state._latest_score

        total = r["score"]
        # Band label
        if total < 20:
            label = "Safe Operating Conditions (Low Risk)"
        elif total < 50:
            label = "Elevated Caution Required (Moderate Risk)"
        elif total < 75:
            label = "Elevated Risk Zone (High Concern)"
        else:
            label = "Critical Alert — Immediate Attention Required"

        # Drivers
        drivers = []
        for fid, pts in [("corridor", r["corridor_pts"]), ("dwell", r["dwell_pts"]),
                         ("advisory", r["advisory_pts"]), ("environment", r["environment_pts"])]:
            share = round(pts / total * 100, 1) if total > 0 else 0
            drivers.append({"id": fid, "label": fid.capitalize(), "points": pts, "share_pct": share})

        # Lighting pct
        lp = scoring.lighting_pct(s["lux"])
        dev_int = scoring.half_up(dev_m)

        # Factors
        factors = [
            {
                "id": "corridor",
                "title": "Route Corridor Compliance",
                "subtitle": f"Deviation Detected ({dev_int}m off corridor)" if dev_int > 10 else "On Corridor",
                "icon": "navigation",
                "points": r["corridor_pts"],
                "impact_label": f"+{r['corridor_pts']} pts",
                "narrative": [seg.model_dump() for seg in corridor_narrative(dev_m)],
                "confidence_pct": r["corridor_confidence"],
                "trace": "GPS Triangulation + OSRM Map-Match",
                "corridor": {"current_label": f"7th St Warehouse Ln", "delta_label": f"Delta: {dev_int}m N-NE"},
            },
            {
                "id": "dwell",
                "title": "Dwell & Stop Duration Anomaly",
                "subtitle": f"Unexpected Stop for {int(s['idle_s']//60)}m {int(s['idle_s']%60)}s" if s["idle_s"] > 60 else "Normal Stop Pattern",
                "icon": "timer_pause",
                "points": r["dwell_pts"],
                "impact_label": f"+{r['dwell_pts']} pts",
                "narrative": [seg.model_dump() for seg in dwell_narrative(s["idle_s"], s["speed"])],
                "confidence_pct": r["dwell_confidence"],
                "trace": f"Speedometer {s['speed']} km/h · Acc ±1.2m",
                "dwell": {"dot_congestion_pct": 0, "scheduled_stops": 0, "speed_kmh": s["speed"], "accuracy_m": 1.2},
            },
            {
                "id": "advisory",
                "title": "Corroborated Incident Reports",
                "subtitle": f"{s['advisories_verified']} Verified Advisory within 600m",
                "icon": "campaign",
                "points": r["advisory_pts"],
                "impact_label": f"+{r['advisory_pts']} pts",
                "narrative": [seg.model_dump() for seg in advisory_narrative(s["advisories_verified"], s["commuter_pings"])],
                "confidence_pct": r["advisory_confidence"],
                "trace": "Municipal OpenCivic Feed #4092-B",
                "advisory": {
                    "source": "Municipal OpenCivic Feed #4092-B",
                    "age_min": 18,
                    "corroboration_label": f"{s['advisories_verified']} Civic feed • {s['commuter_pings']} Commuter pings",
                },
            },
            {
                "id": "environment",
                "title": "Environmental Trust Index",
                "subtitle": "Composite Ambient Surroundings",
                "icon": "nature_people",
                "points": r["environment_pts"],
                "impact_label": f"+{r['environment_pts']} pts",
                "narrative": [seg.model_dump() for seg in environment_narrative(s["lux"], s["crowd"], s["cell"])],
                "confidence_pct": r["environment_confidence"],
                "trace": "Multi-sensor Ambient Fusion",
                "environment": {
                    "quadrants": [
                        {"id": "lighting", "label": "Lighting", "value": f"{lp}%", "sublabel": "Low Luminance" if lp < 50 else "Adequate"},
                        {"id": "cell", "label": "Cell Signal", "value": s["cell"].upper() if s["cell"] == "lte" else s["cell"].capitalize(), "sublabel": "Reliable Uplink" if s["cell"] == "lte" else "Degraded"},
                        {"id": "crowd", "label": "Crowd Density", "value": s["crowd"].capitalize(), "sublabel": "< 3 pedestrians/100m" if s["crowd"] == "sparse" else "Normal"},
                        {"id": "havens", "label": "Safe Havens", "value": "2 Open", "sublabel": "Within 400m radius"},
                    ]
                },
            },
        ]

        # Nearest haven
        nearest = None
        for h in HAVENS:
            d = geo.euclidean(pos, (h["x_m"], h["y_m"]))
            d_int = scoring.half_up(d)
            if nearest is None or d_int < nearest["distance_m"]:
                nearest = {"id": h["id"], "name": h["name"], "distance_m": d_int, "direction": h["direction"], "note": h["hours"]}

        return {
            "engine": {"label": "FastAPI Scoring Engine", "version": ENGINE_VERSION, "evaluated_at": app_state.evaluated_at},
            "score": total,
            "band": r["band"],
            "label": label,
            "safe_threshold": 20,
            "disclaimer": "Algorithmic certainty is transparent. This score reflects an unannounced arterial deviation and atypical stop duration.",
            "weights": WEIGHTS,
            "drivers": drivers,
            "factors": factors,
            "nearest_haven": nearest,
        }
