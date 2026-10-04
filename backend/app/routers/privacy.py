"""Privacy router."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["privacy"])

POLICY_DEFS = [
    {
        "id": "ephemeral_location",
        "title": "Ephemeral Location Retention",
        "description": "Wipe coordinate cache automatically on trip arrival",
    },
    {
        "id": "anonymized_crowdsourcing",
        "title": "Anonymized Incident Crowdsourcing",
        "description": "Transmit k-anonymous noise-perturbed hazard flags",
    },
    {
        "id": "fuzzy_offset",
        "title": "Fuzzy Offset Location Sharing",
        "description": "Obfuscate live guardian feed radius by ±75 meters",
    },
]

COMPLIANCE_BADGES = [
    {"icon": "face", "label": "No Biometrics Stored"},
    {"icon": "videocam_off", "label": "Zero Raw Media"},
    {"icon": "timer_off", "label": "Ephemeral Sessions"},
]


@router.get("/privacy")
async def get_privacy():
    async with app_state.lock:
        policies = []
        for p in POLICY_DEFS:
            policies.append({
                **p,
                "enabled": app_state.policies.get(p["id"], True),
            })
        return {
            "session_id": app_state.session_id,
            "storage": "RAM_ONLY",
            "cipher": "AES-GCM-256",
            "bytes_held": app_state.bytes_held(),
            "policies": policies,
            "compliance_badges": COMPLIANCE_BADGES,
        }


@router.put("/privacy/policies/{policy_id}")
async def update_policy(policy_id: str, body: dict):
    valid_ids = {p["id"] for p in POLICY_DEFS}
    if policy_id not in valid_ids:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    enabled = body.get("enabled")
    if not isinstance(enabled, bool):
        raise HTTPException(status_code=400, detail="enabled must be a boolean")
    async with app_state.lock:
        app_state.policies[policy_id] = enabled
        # If crowdsourcing changed, re-evaluate
        if policy_id == "anonymized_crowdsourcing":
            app_state._latest_score = None
            app_state.evaluate()
        return {"id": policy_id, "enabled": enabled}


@router.post("/privacy/purge")
async def purge_data():
    async with app_state.lock:
        cleared = app_state.purge()
        return {
            "purged": True,
            "bytes_held": app_state.bytes_held(),
            "cleared": cleared,
        }
