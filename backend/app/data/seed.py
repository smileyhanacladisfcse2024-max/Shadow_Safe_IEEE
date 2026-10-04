"""Seed data for havens, routes, guardians, corridor, and emergency lines."""
from __future__ import annotations


HAVENS = [
    {
        "id": "haven-stjude",
        "name": "St. Jude Health Hub",
        "address": "324 Beacon Avenue",
        "icon": "health_and_safety",
        "tags": ["medical", "staffed", "beacon"],
        "x_m": -127,
        "y_m": 127,
        "hours": "24/7",
        "closes_at": None,
        "cctv_cameras": 9,
        "lux": 184,
        "capabilities": [
            {"icon": "meeting_room", "label": "Secure Vestibule"},
            {"icon": "support_agent", "label": "Desk Intercom Link"},
            {"icon": "battery_charging_full", "label": "Fast Device Power"},
            {"icon": "local_police", "label": "Transit Link Hotwire"},
        ],
        "phone": "5550192",
        "direction": "NW",
    },
    {
        "id": "haven-transit-kiosk",
        "name": "Oakland Transit Kiosk",
        "address": "Concourse Level Guard Booth #3",
        "icon": "directions_subway",
        "tags": ["transit", "staffed", "beacon"],
        "x_m": 330,
        "y_m": -80,
        "hours": "24/7",
        "closes_at": None,
        "cctv_cameras": None,
        "lux": None,
        "capabilities": [],
        "phone": None,
        "direction": "E",
    },
    {
        "id": "haven-cvs",
        "name": "CVS 24h & Well-Lit Plaza",
        "address": "502 Harrison St",
        "icon": "local_pharmacy",
        "tags": ["medical", "staffed", "beacon"],
        "x_m": 400,
        "y_m": 90,
        "hours": "24/7",
        "closes_at": None,
        "cctv_cameras": None,
        "lux": None,
        "capabilities": [],
        "phone": None,
        "direction": "E",
    },
    {
        "id": "haven-civic",
        "name": "Civic Center Sanctuary",
        "address": "125 Civic Center Plaza East Wing",
        "icon": "local_library",
        "tags": ["beacon"],
        "x_m": -300,
        "y_m": -425,
        "hours": "Until 23:00",
        "closes_at": "23:00",
        "cctv_cameras": None,
        "lux": None,
        "capabilities": [],
        "phone": None,
        "direction": "SW",
    },
    {
        "id": "haven-harrison",
        "name": "Harrison Community Annex",
        "address": "200 Harrison St Annex",
        "icon": "local_library",
        "tags": ["community"],
        "x_m": -500,
        "y_m": 253,
        "hours": "24/7",
        "closes_at": None,
        "cctv_cameras": None,
        "lux": None,
        "capabilities": [],
        "phone": None,
        "direction": "NW",
    },
]


ROUTES = [
    {
        "id": "a",
        "name": "Route A: Current Diverted",
        "tag": "",
        "description": "Dark alleyways, low visibility zone",
        "time_min": 12,
        "time_delta": "Fastest",
        "concern": 38,
        "chips": [
            {"icon": "crisis_alert", "label": "High Concern"},
            {"icon": "power_off", "label": "Dimly Lit"},
        ],
        "metrics": [
            {"label": "28% Illumination", "detail": "Sensor verified"},
            {"label": "Degraded 3G", "detail": "2 dead-zones detected"},
            {"label": "No Safe Haven", "detail": "Nearest 520m away"},
            {"label": "No Patrol", "detail": "Unstaffed sector"},
        ],
    },
    {
        "id": "b",
        "name": "Route B: Safe Haven",
        "tag": "Recommended",
        "description": "Well-lit commercial avenue, 4 open 24/7 stores",
        "time_min": 15,
        "time_delta": "+3 min",
        "concern": 8,
        "chips": [
            {"icon": "shield", "label": "Concern: 8/100"},
            {"icon": "videocam", "label": "CCTV Monitored"},
        ],
        "metrics": [
            {"label": "92% Illumination", "detail": "Sensor verified"},
            {"label": "Continuous 5G", "detail": "Zero dead-zones"},
            {"label": "Safe Haven @350m", "detail": "24/7 Pharmacy"},
            {"label": "Police Substation", "detail": "Active patrol area"},
        ],
    },
    {
        "id": "c",
        "name": "Route C: Transit Hub",
        "tag": "",
        "description": "Oakland Central Station concourse link",
        "time_min": 18,
        "time_delta": "+6 min",
        "concern": 11,
        "chips": [
            {"icon": "verified", "label": "Concern: 11/100"},
            {"icon": "train", "label": "Staffed Hub"},
        ],
        "metrics": [
            {"label": "85% Illumination", "detail": "Platform lighting"},
            {"label": "Continuous 4G LTE", "detail": "Zero dead-zones"},
            {"label": "Transit Kiosk @340m", "detail": "Guard Booth"},
            {"label": "Transit Police", "detail": "Stationed 24/7"},
        ],
    },
]


GUARDIANS = [
    {
        "id": "guardian-alice",
        "name": "Alice M.",
        "relation": "Family",
        "kind": "personal",
        "battery_pct": 84,
        "status_text": "Battery 84% • Location shared live",
        "location_shared": True,
        "priority_link": False,
    },
    {
        "id": "guardian-maya",
        "name": "Maya R.",
        "relation": "Friend",
        "kind": "personal",
        "battery_pct": 61,
        "status_text": "Battery 61% • Location shared live",
        "location_shared": True,
        "priority_link": False,
    },
    {
        "id": "guardian-transit",
        "name": "Transit Safety & Campus Patrol",
        "relation": "Official",
        "kind": "official",
        "battery_pct": None,
        "status_text": "Priority dispatch link ready",
        "location_shared": True,
        "priority_link": True,
    },
]


EMERGENCY_LINES = [
    {"name": "911 Emergency Dispatch", "tel": "tel:911", "tag": "DIRECT"},
    {"name": "Campus & Transit Safety Patrol", "tel": "tel:5550199", "tag": ""},
]


CORRIDOR_POLYLINE = [
    (-220, -1500),
    (-220, 1500),
]
