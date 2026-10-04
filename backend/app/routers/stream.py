"""SSE stream router."""
from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from app.services.sse import sse_hub
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["stream"])


@router.get("/stream")
async def event_stream(request: Request):
    q = sse_hub.subscribe()

    async def generator():
        try:
            # Send current snapshot immediately on connect
            async with app_state.lock:
                if app_state._latest_score is None:
                    app_state.evaluate()
                snapshot = app_state.build_journey_snapshot()
            yield {"event": "journey", "data": json.dumps(snapshot)}

            # Then stream updates
            async for msg in sse_hub.stream(q):
                if await request.is_disconnected():
                    break
                yield msg
        except asyncio.CancelledError:
            pass
        finally:
            sse_hub.unsubscribe(q)

    return EventSourceResponse(generator())
