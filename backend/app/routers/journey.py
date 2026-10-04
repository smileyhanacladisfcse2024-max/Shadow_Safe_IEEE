"""Journey router."""
from __future__ import annotations

from fastapi import APIRouter

from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["journey"])


@router.get("/journey")
async def get_journey():
    async with app_state.lock:
        if app_state._latest_score is None:
            app_state.evaluate()
        return app_state.build_journey_snapshot()


@router.post("/alert/dismiss")
async def dismiss_alert():
    async with app_state.lock:
        app_state.alert_dismissed = True
        return app_state.build_journey_snapshot()


@router.post("/journey/corridor")
async def update_corridor(body: dict):
    async with app_state.lock:
        app_state.custom_corridor = body
        return app_state.build_journey_snapshot()
