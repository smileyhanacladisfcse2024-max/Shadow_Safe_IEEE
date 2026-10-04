"""Background async tasks: SOS grace timer, evaluator loop, silent-escort loop."""
from __future__ import annotations

import asyncio

from app.config import settings
from app.services import clock
from app.services.notifier import create_notification
from app.services.sse import sse_hub
from app.state.store import app_state

_evaluator_task: asyncio.Task | None = None
_silent_escort_task: asyncio.Task | None = None


async def sos_grace_timer() -> None:
    """After GRACE_SECONDS, dispatch SOS if not cancelled."""
    try:
        await asyncio.sleep(settings.grace_seconds)
        async with app_state.lock:
            if app_state.sos_state == "armed":
                app_state.sos_state = "dispatched"
                personal = [g["name"] for g in app_state.guardians if g["kind"] == "personal"]
                all_recipients = personal + ["911 (simulated)"]
                notif = create_notification("sos_dispatch", "SOS dispatched — live coordinates broadcast", all_recipients)
                app_state.notifications.append(notif)
        await sse_hub.publish("sos", {"state": "dispatched", "timestamp": clock.now_iso()})
    except asyncio.CancelledError:
        pass


async def evaluator_loop() -> None:
    """Re-score every EVAL_INTERVAL_S and push SSE."""
    try:
        while True:
            await asyncio.sleep(settings.eval_interval_s)
            async with app_state.lock:
                app_state.evaluate()
                snapshot = app_state.build_journey_snapshot()
            await sse_hub.publish("journey", snapshot)
    except asyncio.CancelledError:
        pass


async def silent_escort_loop() -> None:
    """Emit SSE check-in every SILENT_CHECKIN_S while enabled."""
    try:
        while True:
            await asyncio.sleep(settings.silent_checkin_s)
            async with app_state.lock:
                if not app_state.silent_escort_enabled:
                    continue
                await sse_hub.publish("checkin", {"timestamp": clock.now_iso()})
                # Wait for confirmation
                app_state.last_checkin_confirmed = 0.0

            # Wait for timeout
            await asyncio.sleep(settings.checkin_timeout_s)
            async with app_state.lock:
                if app_state.silent_escort_enabled and app_state.last_checkin_confirmed == 0.0:
                    personal = [g["name"] for g in app_state.guardians if g["kind"] == "personal"]
                    notif = create_notification("checkin_missed", "No response to check-in", personal)
                    app_state.notifications.append(notif)
    except asyncio.CancelledError:
        pass


def start_background_tasks() -> None:
    global _evaluator_task, _silent_escort_task
    _evaluator_task = asyncio.create_task(evaluator_loop())
    _silent_escort_task = asyncio.create_task(silent_escort_loop())


def stop_background_tasks() -> None:
    global _evaluator_task, _silent_escort_task
    if _evaluator_task and not _evaluator_task.done():
        _evaluator_task.cancel()
    if _silent_escort_task and not _silent_escort_task.done():
        _silent_escort_task.cancel()
