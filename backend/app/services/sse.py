"""SSE pub/sub hub."""
from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator


class SSEHub:
    """Simple pub-sub for Server-Sent Events."""

    def __init__(self) -> None:
        self._queues: list[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._queues.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        if q in self._queues:
            self._queues.remove(q)

    async def publish(self, event: str, data: dict) -> None:
        try:
            from fastapi.encoders import jsonable_encoder
            payload = json.dumps(jsonable_encoder(data))
        except Exception:
            payload = json.dumps(data, default=str)
        for q in list(self._queues):
            try:
                q.put_nowait({"event": event, "data": payload})
            except asyncio.QueueFull:
                pass

    async def stream(self, q: asyncio.Queue) -> AsyncGenerator[dict, None]:
        try:
            while True:
                msg = await q.get()
                yield msg
        except asyncio.CancelledError:
            pass


sse_hub = SSEHub()
