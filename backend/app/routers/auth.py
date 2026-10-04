"""Authentication & Women's Safety User Profile Router for ShadowSafe 2.0.

Provides profile management, onboarding, login/logout, and geocoding proxies.
"""
from __future__ import annotations

import copy
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.osm_routing import search_places, reverse_geocode
from app.state.store import app_state

router = APIRouter(prefix="/api", tags=["auth"])


class GuardianInfo(BaseModel):
    name: str
    phone: str
    relation: str = "Family"
    notify_on_deviation: bool = True


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    blood_group: str | None = None
    home_address: str | None = None
    home_lat: float | None = None
    home_lng: float | None = None
    work_address: str | None = None
    work_lat: float | None = None
    work_lng: float | None = None
    primary_guardian: GuardianInfo | None = None
    secondary_guardian: GuardianInfo | None = None
    medical_notes: str | None = None
    emergency_code: str | None = None


class LoginRequest(BaseModel):
    phone_or_email: str
    password: str | None = None
    is_guest: bool = False


@router.get("/auth/profile")
async def get_profile():
    """Retrieve the current user safety profile."""
    async with app_state.lock:
        return app_state.user_profile


@router.post("/auth/profile")
@router.put("/auth/profile")
async def update_profile(body: ProfileUpdateRequest):
    """Update user safety profile and synchronize emergency guardians."""
    async with app_state.lock:
        profile = app_state.user_profile
        updates = body.model_dump(exclude_unset=True)

        for key, value in updates.items():
            if value is not None:
                profile[key] = value

        profile["onboarding_completed"] = True
        profile["is_authenticated"] = True

        # Synchronize active guardians in state store with primary and secondary contacts
        new_guardians = []
        if profile.get("primary_guardian"):
            pg = profile["primary_guardian"]
            new_guardians.append({
                "id": "guardian-primary",
                "name": pg.get("name", "Primary Guardian"),
                "relation": pg.get("relation", "Family"),
                "kind": "personal",
                "phone": pg.get("phone", ""),
                "battery_pct": 89,
                "status_text": "Live tracking active • Battery 89%",
                "location_shared": True,
                "priority_link": True,
            })

        if profile.get("secondary_guardian"):
            sg = profile["secondary_guardian"]
            new_guardians.append({
                "id": "guardian-secondary",
                "name": sg.get("name", "Secondary Guardian"),
                "relation": sg.get("relation", "Family"),
                "kind": "personal",
                "phone": sg.get("phone", ""),
                "battery_pct": 74,
                "status_text": "Standby link ready • Battery 74%",
                "location_shared": True,
                "priority_link": False,
            })

        # Preserve official dispatch line
        new_guardians.append({
            "id": "guardian-transit",
            "name": "Women & Transit Safety Rapid Patrol",
            "relation": "Official",
            "kind": "official",
            "phone": "1091 / 112",
            "battery_pct": None,
            "status_text": "Priority emergency dispatch hotwire ready",
            "location_shared": True,
            "priority_link": True,
        })

        app_state.guardians = new_guardians
        return {"message": "Safety profile successfully updated", "profile": profile}


@router.post("/auth/login")
async def login(body: LoginRequest):
    """Sign in or start guest session with demo profile."""
    async with app_state.lock:
        app_state.user_profile["is_authenticated"] = True
        if body.is_guest:
            app_state.user_profile["name"] = "Priya Sharma (Demo)"
        elif body.phone_or_email:
            app_state.user_profile["phone"] = body.phone_or_email

        return {
            "message": "Authenticated successfully",
            "user": app_state.user_profile,
        }


@router.post("/auth/logout")
async def logout():
    """Sign out user."""
    async with app_state.lock:
        app_state.user_profile["is_authenticated"] = False
        return {"message": "Logged out successfully"}


@router.get("/geo/search")
async def geo_search(q: str, limit: int = 5):
    """Free OpenStreetMap Nominatim place search with instant fallback."""
    results = await search_places(q, limit=limit)
    return {"results": results}


@router.get("/geo/reverse")
async def geo_reverse(lat: float, lng: float):
    """Free OpenStreetMap Nominatim reverse geocoding."""
    address = await reverse_geocode(lat, lng)
    return {"address": address, "lat": lat, "lng": lng}
