"""Notification outbox helper."""
from __future__ import annotations

import uuid

from app.services import clock


def create_notification(kind: str, message: str, recipients: list[str]) -> dict:
    return {
        "id": str(uuid.uuid4())[:8],
        "kind": kind,
        "message": message,
        "recipients": recipients,
        "created_at": clock.now_iso(),
    }
