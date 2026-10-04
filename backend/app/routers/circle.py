"""Circle notification and share routers."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services import clock
from app.services.notifier import create_notification
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["circle"])


@router.post("/circle/notify")
async def notify_circle(body: dict):
    kind = body.get("kind")
    valid_kinds = {"journey_alert", "reroute", "haven_diversion", "audit_log"}
    if kind not in valid_kinds:
        raise HTTPException(status_code=400, detail=f"kind must be one of {valid_kinds}")
    async with app_state.lock:
        personal = [g["name"] for g in app_state.guardians if g["kind"] == "personal"]
        notif = create_notification(kind, f"Guardian Circle notified ({kind.replace('_', ' ')})", personal)
        app_state.notifications.append(notif)
        return {
            "message": f"Guardian Circle notified: {', '.join(personal)}",
            "recipients": personal,
            "notification_ids": [notif["id"]],
        }


@router.get("/circle/notifications")
async def get_notifications():
    async with app_state.lock:
        return {"notifications": app_state.notifications}
