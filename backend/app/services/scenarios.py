"""Five demo stages with tuned inputs."""
from __future__ import annotations

STAGES = {
    1: {
        "name": "Nominal Baseline",
        "subtitle": "Standard lit path - Verified corridor",
        "position": (-180, -40),
        "speed": 26,
        "idle_s": 75,
        "advisories_verified": 1,
        "commuter_pings": 2,
        "lux": 34,
        "crowd": "moderate",
        "cell": "lte",
        "audio_anomaly": 0,
        "grid_outage": False,
        "heading": "N",
        "alert": None,
    },
    2: {
        "name": "Route Deviation (Active)",
        "subtitle": "220m off path - Amber caution alert",
        "position": (0, 0),
        "speed": 18,
        "idle_s": 225,
        "advisories_verified": 1,
        "commuter_pings": 3,
        "lux": 15,
        "crowd": "sparse",
        "cell": "lte",
        "audio_anomaly": 0,
        "grid_outage": False,
        "heading": "N",
        "alert": {
            "severity": "warning",
            "template": "Route deviation: Bus turned onto {unlit 7th St}. Guardians alerted.",
        },
    },
    3: {
        "name": "Unscheduled Stop",
        "subtitle": "4m idle interval - Unverified dark sector",
        "position": (180, 60),
        "speed": 0,
        "idle_s": 240,
        "advisories_verified": 2,
        "commuter_pings": 3,
        "lux": 3,
        "crowd": "sparse",
        "cell": "degraded",
        "audio_anomaly": 0,
        "grid_outage": False,
        "heading": "N",
        "alert": {
            "severity": "critical",
            "template": "Unscheduled stop: vehicle idle for {4m} in an unverified dark sector. Guardians alerted.",
        },
    },
    4: {
        "name": "Incident Corroboration",
        "subtitle": "Audio noise surge + Lighting grid outage",
        "position": (180, 60),
        "speed": 0,
        "idle_s": 420,
        "advisories_verified": 2,
        "commuter_pings": 6,
        "lux": 0,
        "crowd": "sparse",
        "cell": "degraded",
        "audio_anomaly": 8,
        "grid_outage": True,
        "heading": "N",
        "alert": {
            "severity": "critical",
            "template": "Incident corroborated: {audio surge} and {lighting grid outage} nearby. Emergency Circle on standby.",
        },
    },
    5: {
        "name": "Safer Reroute Recommended",
        "subtitle": "Transit corridor diverted via 4th Ave",
        "position": (-195, -20),
        "speed": 22,
        "idle_s": 150,
        "advisories_verified": 1,
        "commuter_pings": 2,
        "lux": 40,
        "crowd": "moderate",
        "cell": "lte",
        "audio_anomaly": 0,
        "grid_outage": False,
        "heading": "N",
        "alert": {
            "severity": "info",
            "template": "Safer corridor recommended via {Broadway}. Review Routes.",
        },
    },
}


def get_stage(stage_id: int) -> dict:
    """Return stage dict or raise ValueError."""
    if stage_id not in STAGES:
        raise ValueError(f"Stage {stage_id} not found; valid: 1-5")
    return STAGES[stage_id]
