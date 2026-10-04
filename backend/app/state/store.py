"""Single in-memory application state — NO database, NO files.

Guarded by asyncio.Lock for concurrent access safety.
"""
from __future__ import annotations

import asyncio
import copy
import random
import sys
import uuid

from app.config import settings
from app.data.seed import EMERGENCY_LINES, GUARDIANS, HAVENS, ROUTES
from app.services import clock, geo, scoring
from app.services.narratives import (
    advisory_narrative,
    corridor_explanation,
    corridor_narrative,
    dwell_narrative,
    environment_narrative,
    lighting_label,
    parse_alert_template,
)
from app.services.scenarios import STAGES, get_stage


class AppState:
    def __init__(self) -> None:
        self.lock = asyncio.Lock()
        self._reset()

    def _reset(self) -> None:
        """Reset to boot state (stage 2, all policies ON)."""
        self.stage: int = 2
        self.session_id: str = "SS-2026-WIE-489"
        self.trip_id: str = "482"
        self.custom_corridor: dict | None = None

        # Guardians (deep copy so mutations don't affect seed)
        self.guardians: list[dict] = copy.deepcopy(GUARDIANS)

        # Policies (all ON by default)
        self.policies: dict[str, bool] = {
            "ephemeral_location": True,
            "anonymized_crowdsourcing": True,
            "fuzzy_offset": True,
        }

        # SOS state
        self.sos_state: str = "idle"  # idle|armed|dispatched
        self.sos_task: asyncio.Task | None = None

        # Silent escort
        self.silent_escort_enabled: bool = False
        self.last_checkin_confirmed: float = 0.0

        # Route selection
        self.selected_route_id: str = "b"
        self.auto_reroute_enabled: bool = True
        self.auto_reroute_standing_by: bool = False

        # Alert dismissed
        self.alert_dismissed: bool = False

        # Telemetry buffer & outbox
        self.telemetry_buffer: list[dict] = []
        self.notifications: list[dict] = []
        self.share_links: list[dict] = []

        # Previous band for escalation tracking
        self._prev_band: str = "safe"
        self._escalation_keys: set[str] = set()

        # User profile for women's safety platform
        self.user_profile: dict = {
            "id": "usr-8924",
            "name": "Priya Sharma",
            "phone": "+91 98765 43210",
            "email": "priya.sharma@safenet.org",
            "blood_group": "O+",
            "home_address": "42 Sunrise Heights, 12th Main Road",
            "home_lat": 12.9716,
            "home_lng": 77.6412,
            "work_address": "Cyber Tech Park, Building 4",
            "work_lat": 12.8452,
            "work_lng": 77.6602,
            "primary_guardian": {
                "name": "Anita Sharma (Mother)",
                "phone": "+91 98765 43211",
                "relation": "Parent",
                "notify_on_deviation": True,
            },
            "secondary_guardian": {
                "name": "Rohan Sharma (Brother)",
                "phone": "+91 98765 43212",
                "relation": "Family",
                "notify_on_deviation": True,
            },
            "medical_notes": "Mild asthma (inhaler carried in bag). No known allergies.",
            "emergency_code": "Silver Sparrow",
            "is_authenticated": True,
            "onboarding_completed": True,
        }

        # Real routing and nearby havens
        self.active_routes: list[dict] = []
        self.real_havens: list[dict] = []
        self.current_user_location: dict = {"lat": 12.9716, "lng": 77.6412, "accuracy": 5}

        # Evaluated at
        self.evaluated_at: str = ""

        # Cache of latest scoring result
        self._latest_score: dict | None = None

    def reset(self) -> None:
        if self.sos_task and not self.sos_task.done():
            self.sos_task.cancel()
        self._reset()

    def get_stage_inputs(self) -> dict:
        return get_stage(self.stage)

    def evaluate(self) -> dict:
        """Run the scoring engine on current stage inputs. Returns scoring result."""
        s = self.get_stage_inputs()
        pos = s["position"]
        dev_m = geo.corridor_deviation(pos[0])
        crowdsourcing_on = self.policies.get("anonymized_crowdsourcing", True)

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
        self.evaluated_at = clock.now_iso()
        self._latest_score = result

        # Auto-reroute standing by logic
        if self.auto_reroute_enabled and result["score"] > 50:
            self.auto_reroute_standing_by = True
        else:
            self.auto_reroute_standing_by = False

        # Escalation: track band changes
        new_band = result["band"]
        band_order = {"safe": 0, "moderate": 1, "elevated": 2, "critical": 3}
        esc_key = f"{self.stage}_{new_band}"
        if band_order.get(new_band, 0) > band_order.get(self._prev_band, 0):
            if esc_key not in self._escalation_keys:
                self._escalation_keys.add(esc_key)
                personal = [g["name"] for g in self.guardians if g["kind"] == "personal"]
                from app.services.notifier import create_notification
                notif = create_notification(
                    "escalation",
                    f"Guardians alerted: risk escalated to {new_band}",
                    personal,
                )
                self.notifications.append(notif)
        self._prev_band = new_band

        # Append telemetry point
        point = {
            "stage": self.stage,
            "score": result["score"],
            "position": list(s["position"]),
            "timestamp": self.evaluated_at,
        }
        self.telemetry_buffer.append(point)

        return result

    def build_journey_snapshot(self) -> dict:
        """Build a full JourneySnapshot dict."""
        s = self.get_stage_inputs()
        pos = s["position"]
        dev_m = geo.corridor_deviation(pos[0])

        if self._latest_score is None:
            self.evaluate()
        result = self._latest_score

        # Speed jitter (+/-1)
        speed = s["speed"] + random.choice([-1, 0, 1])

        # Lighting label
        ll = lighting_label(s["lux"])

        # Alert
        alert = None
        if s.get("alert") and not self.alert_dismissed:
            alert_data = s["alert"]
            msg_segments = parse_alert_template(alert_data["template"])
            # Append auto-reroute standing by
            if self.auto_reroute_standing_by:
                msg_segments.append({"t": " Auto-reroute standing by.", "b": False})
            alert = {
                "id": f"alert-stage-{self.stage}",
                "severity": alert_data["severity"],
                "message": msg_segments,
                "dismissed": False,
            }

        # Guardian summary
        personal = [g for g in self.guardians if g["kind"] == "personal"]
        guardian_names = [g["name"] for g in personal]

        # Nearest havens
        if self.real_havens:
            havens_nearby_items = []
            for h in self.real_havens[:4]:
                havens_nearby_items.append({
                    "id": h["id"],
                    "name": h["name"],
                    "icon": h["icon"],
                    "distance_m": h["distance_m"],
                    "note": h.get("note", f"{h.get('hours', '24/7')} • {h.get('direction', '')}"),
                    "lat": h.get("lat"),
                    "lng": h.get("lng"),
                    "phone": h.get("phone", "112"),
                    "x_m": 0.0,
                    "y_m": 0.0,
                })
            count_500 = sum(1 for h in self.real_havens if h["distance_m"] <= 500)
        else:
            havens_with_dist = []
            for h in HAVENS:
                d = geo.euclidean(pos, (h["x_m"], h["y_m"]))
                d_int = scoring.half_up(d)
                havens_with_dist.append({**h, "distance_m": d_int})
            havens_with_dist.sort(key=lambda x: x["distance_m"])

            havens_nearby_items = []
            for h in havens_with_dist[:3]:
                havens_nearby_items.append({
                    "id": h["id"],
                    "name": h["name"],
                    "icon": h["icon"],
                    "distance_m": h["distance_m"],
                    "note": f"{h['hours']} • {h['direction']}",
                    "x_m": h["x_m"],
                    "y_m": h["y_m"],
                })

            count_500 = sum(1 for h in havens_with_dist if h["distance_m"] <= 500)

        explanation = corridor_explanation(dev_m)

        snapshot = {
            "trip_id": self.trip_id,
            "session_id": self.session_id,
            "stage": self.stage,
            "evaluated_at": self.evaluated_at,
            "user_profile": self.user_profile,
            "trip": {
                "line_label": (self.custom_corridor.get("line_label") if self.custom_corridor else None) or "Safe Corridor Express",
                "line_short": (self.custom_corridor.get("line_short") if self.custom_corridor else None) or "SAFE",
                "status_chip": "Active Corridor Monitored",
                "origin": (self.custom_corridor.get("origin") if self.custom_corridor else None) or "Indiranagar 100ft Rd",
                "destination": (self.custom_corridor.get("destination") if self.custom_corridor else None) or "Electronic City Campus",
                "origin_lat": (self.custom_corridor.get("origin_lat") if self.custom_corridor else None) or 12.9716,
                "origin_lng": (self.custom_corridor.get("origin_lng") if self.custom_corridor else None) or 77.6412,
                "dest_lat": (self.custom_corridor.get("dest_lat") if self.custom_corridor else None) or 12.8452,
                "dest_lng": (self.custom_corridor.get("dest_lng") if self.custom_corridor else None) or 77.6602,
                "eta_minutes": (self.custom_corridor.get("eta_minutes") if self.custom_corridor else None) or 14,
                "eta_clock": clock.eta_clock((self.custom_corridor.get("eta_minutes") if self.custom_corridor else None) or 14),
                "distance_km": (self.custom_corridor.get("distance_km") if self.custom_corridor else None) or 3.4,
                "lighting_lux": (self.custom_corridor.get("lighting_lux") if self.custom_corridor else None) or s["lux"],
                "lighting_label": (self.custom_corridor.get("lighting_label") if self.custom_corridor else None) or ll,
                "crowd_label": (self.custom_corridor.get("crowd_label") if self.custom_corridor else None) or s["crowd"].capitalize(),
                "polyline": (self.custom_corridor.get("polyline") if self.custom_corridor else None) or [],
                "is_real_route": bool(self.custom_corridor.get("is_real_route")) if self.custom_corridor else False,
            },
            "vehicle": {
                "x_m": pos[0],
                "y_m": pos[1],
                "speed_kmh": speed,
                "heading": s["heading"],
                "idle_s": s["idle_s"],
            },
            "corridor": {
                "deviation_m": scoring.half_up(dev_m),
                "divergence_point": {"x_m": pos[0], "y_m": pos[1]},
                "street_label": (self.custom_corridor.get("street_label") if self.custom_corridor else None) or "7th St",
            },
            "risk": {
                "score": result["score"],
                "band": result["band"],
                "badge": result["badge"],
                "headline": "Route Deviation" if dev_m > 50 else "Nominal",
                "explanation": [seg if isinstance(seg, dict) else seg.model_dump() for seg in explanation],
            },
            "alert": alert,
            "guardians": {
                "connected": len(personal),
                "names": guardian_names,
                "status": "Protected",
                "sharing_text": "Sharing live GPS location & bus status",
            },
            "havens_nearby": {
                "count_within_500m": count_500,
                "items": havens_nearby_items,
            },
            "sensors": {
                "gps_accuracy_m": 1.2,
                "cell_signal": s["cell"],
                "audio_anomaly": s["audio_anomaly"],
            },
            "sos": {
                "state": self.sos_state,
            },
        }
        return snapshot

    def bytes_held(self) -> int:
        """Approximate byte size of telemetry buffer + outbox + share links."""
        return sys.getsizeof(str(self.telemetry_buffer)) + sys.getsizeof(str(self.notifications)) + sys.getsizeof(str(self.share_links))

    def purge(self) -> dict:
        """Clear telemetry, notifications, share links. Keep guardians, stage, policies."""
        counts = {
            "telemetry_points": len(self.telemetry_buffer),
            "notifications": len(self.notifications),
            "share_links": len(self.share_links),
        }
        self.telemetry_buffer.clear()
        self.notifications.clear()
        self.share_links.clear()
        return counts

    def add_share_link(self) -> dict:
        """Create a new ephemeral share link."""
        token = str(uuid.uuid4())[:12]
        passcode = f"{random.randint(1000, 9999)}"
        expires = clock.now()
        from datetime import timedelta
        expires_at = (expires + timedelta(minutes=30)).isoformat(timespec="seconds")
        link = {
            "token": token,
            "passcode": passcode,
            "expires_at": expires_at,
            "url": f"http://localhost:5173/share/{token}",
        }
        self.share_links.append(link)
        return link

    def get_share_link(self, token: str) -> dict | None:
        for link in self.share_links:
            if link["token"] == token:
                return link
        return None

    def apply_fuzzy_offset(self, pos: tuple[float, float]) -> tuple[float, float]:
        """Apply +/-75m random offset if fuzzy_offset policy is ON."""
        if self.policies.get("fuzzy_offset", True):
            ox = random.uniform(-75, 75)
            oy = random.uniform(-75, 75)
            return (pos[0] + ox, pos[1] + oy)
        return pos


# Singleton
app_state = AppState()
