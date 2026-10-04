"""ShadowSafe 2.0 — FastAPI Application Factory."""
from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.config import settings
from app.routers import (
    auth,
    circle,
    demo,
    guardians,
    havens,
    health,
    journey,
    privacy,
    risk,
    routes,
    share,
    sos,
    stream,
)
from app.services.clock import init_clock
from app.services.tasks import start_background_tasks, stop_background_tasks
from app.state.store import app_state


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background tasks on startup, stop on shutdown."""
    init_clock()
    async with app_state.lock:
        app_state.evaluate()
    start_background_tasks()
    yield
    stop_background_tasks()


app = FastAPI(
    title="ShadowSafe 2.0 API",
    description="Explainable journey-safety backend for IEEE WIE ILS 2026 hackathon demo",
    version="2.4.2",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Error handlers
@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": str(exc), "details": None}},
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An internal error occurred", "details": None}},
    )


# X-Process-Time-Ms header middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    process_time = round((time.perf_counter() - start) * 1000, 1)
    response.headers["X-Process-Time-Ms"] = str(process_time)
    return response


# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(journey.router)
app.include_router(risk.router)
app.include_router(demo.router)
app.include_router(routes.router)
app.include_router(havens.router)
app.include_router(guardians.router)
app.include_router(circle.router)
app.include_router(share.router)
app.include_router(sos.router)
app.include_router(privacy.router)
app.include_router(stream.router)
