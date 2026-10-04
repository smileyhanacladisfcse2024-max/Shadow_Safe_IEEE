"""Narrative text generation using Segment[] for rich text without innerHTML.

Templates are driven by computed inputs, not hard-coded per stage.
"""
from __future__ import annotations

from app.schemas.common import Segment
from app.services.scoring import half_up


def _seg(text: str, bold: bool = False) -> Segment:
    return Segment(t=text, b=bold)


def parse_alert_template(template: str) -> list[Segment]:
    """Parse alert templates: text in {braces} becomes bold segments."""
    segments: list[Segment] = []
    i = 0
    while i < len(template):
        start = template.find("{", i)
        if start == -1:
            segments.append(_seg(template[i:]))
            break
        if start > i:
            segments.append(_seg(template[i:start]))
        end = template.find("}", start)
        if end == -1:
            segments.append(_seg(template[start:]))
            break
        segments.append(_seg(template[start + 1 : end], bold=True))
        i = end + 1
    return segments


def corridor_narrative(dev_m: float) -> list[Segment]:
    dev_int = half_up(dev_m)
    return [
        _seg("Vehicle turned off "),
        _seg("Grand Blvd corridor", bold=True),
        _seg(" into "),
        _seg("7th St warehouse precinct", bold=True),
        _seg(f". Normal transit bus routes do not navigate this side arterial. Deviation: "),
        _seg(f"{dev_int}m", bold=True),
        _seg(" from scheduled corridor."),
    ]


def corridor_explanation(dev_m: float) -> list[Segment]:
    dev_int = half_up(dev_m)
    return [
        _seg("Route deviation detected: vehicle diverted "),
        _seg(f"{dev_int}m", bold=True),
        _seg(" from regular scheduled transit line."),
    ]


def dwell_narrative(idle_s: float, speed: float) -> list[Segment]:
    mins = int(idle_s // 60)
    secs = int(idle_s % 60)
    time_str = f"{mins}m {secs}s" if secs else f"{mins}m"
    return [
        _seg(f"Unscheduled halt for "),
        _seg(time_str, bold=True),
        _seg(f" outside designated metro transit stops without matching municipal traffic delay or red light telemetry at this junction. Speed: "),
        _seg(f"{speed} km/h", bold=True),
        _seg("."),
    ]


def advisory_narrative(verified: int, pings: int) -> list[Segment]:
    return [
        _seg(f"Local transit advisory logged regarding street lighting repair & low footfall zone near "),
        _seg("7th & Market", bold=True),
        _seg(f". Corroboration: "),
        _seg(f"{verified} Civic feed", bold=True),
        _seg(" • "),
        _seg(f"{pings} Commuter pings", bold=True),
        _seg("."),
    ]


def environment_narrative(lux: float, crowd: str, cell: str) -> list[Segment]:
    lp = min(100, half_up(lux / 44 * 100))
    return [
        _seg(f"Ambient surroundings: Lighting at "),
        _seg(f"{lp}%", bold=True),
        _seg(f", crowd density "),
        _seg(crowd.capitalize(), bold=True),
        _seg(f", cell signal "),
        _seg(cell.upper(), bold=True),
        _seg(". Composite environmental trust calculated from 4 quadrants."),
    ]


def lighting_label(lux: float) -> str:
    if lux >= 44:
        return f"Good ({half_up(lux)} lx)"
    elif lux >= 20:
        return f"Low ({half_up(lux)} lx)"
    elif lux > 0:
        return f"Very Low ({half_up(lux)} lx)"
    else:
        return "No Light (0 lx)"
