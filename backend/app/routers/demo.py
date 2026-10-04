"""Demo control router."""
from __future__ import annotations

import time

from fastapi import APIRouter, HTTPException

from app.services import scoring
from app.services.geo import corridor_deviation
from app.services.scenarios import STAGES
from app.services.sse import sse_hub
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["demo"])


@router.get("/demo/stages")
async def get_stages():
    async with app_state.lock:
        active = app_state.stage
        stages = []
        for sid, s in STAGES.items():
            pos = s["position"]
            dev_m = corridor_deviation(pos[0])
            crowdsourcing_on = app_state.policies.get("anonymized_crowdsourcing", True)
            result = scoring.compute_score(
                dev_m=dev_m,
                idle_s=s["idle_s"],
                advisories_verified=s["advisories_verified"],
                commuter_pings=s["commuter_pings"],
                lux=s["lux"],
                crowd=s["crowd"],
                cell=s["cell"],
                audio_anomaly=s["audio_anomaly"],
                grid_outage=s["grid_outage"],
                crowdsourcing_on=crowdsourcing_on,
            )
            stages.append({
                "id": sid,
                "name": s["name"],
                "subtitle": s["subtitle"],
                "score": result["score"],
                "active": sid == active,
            })
        return {"active_stage": active, "stages": stages}


@router.post("/telemetry/mock")
async def telemetry_mock(body: dict):
    t0 = time.perf_counter()
    async with app_state.lock:
        if "stage" in body and body["stage"] is not None:
            stage = body["stage"]
            if stage not in STAGES:
                raise HTTPException(status_code=400, detail=f"Stage must be 1-5, got {stage}")
            app_state.stage = stage
            app_state.alert_dismissed = False
            app_state._latest_score = None
        elif "custom" in body and body["custom"] is not None:
            custom = body["custom"]
            # Validate ranges
            if "audio_anomaly" in custom and not (0 <= custom["audio_anomaly"] <= 8):
                raise HTTPException(status_code=400, detail="audio_anomaly must be 0-8")
            if "lux" in custom and custom["lux"] < 0:
                raise HTTPException(status_code=400, detail="lux must be >= 0")
            # Apply custom to current stage (override)
            pass

        app_state.evaluate()
        snapshot = app_state.build_journey_snapshot()
        r = app_state._latest_score

    latency = round((time.perf_counter() - t0) * 1000, 1)

    await sse_hub.publish("journey", snapshot)

    return {
        "journey": snapshot,
        "risk_score": r["score"],
        "band": r["band"],
        "latency_ms": latency,
    }


@router.post("/demo/reset")
async def demo_reset():
    async with app_state.lock:
        app_state.reset()
        app_state.evaluate()
    return {"message": "Demo reset to boot state (stage 2)", "active_stage": 2}
