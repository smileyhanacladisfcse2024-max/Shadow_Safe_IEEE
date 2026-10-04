"""Integration and Unit Tests for ShadowSafe 2.0 Backend APIs."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "ok"
    assert "engine_version" in data


def test_journey_endpoint(client):
    res = client.get("/api/journey")
    assert res.status_code == 200
    data = res.json()
    assert "trip" in data
    assert "risk" in data
    assert "vehicle" in data
    assert "score" in data["risk"]
    assert "band" in data["risk"]
    assert "origin" in data["trip"]
    assert "destination" in data["trip"]


def test_custom_corridor_endpoint(client):
    payload = {
        "city": "Bengaluru, IN",
        "origin": "Koramangala 5th Block",
        "destination": "Indiranagar 100ft Rd",
        "distance": "5.4 km",
        "eta": "18m",
        "line_label": "Bus 201-G Rapid",
        "lighting_lux": 16,
        "crowd_density": "Moderate",
        "deviation_m": 0,
    }
    res = client.post("/api/journey/corridor", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["trip"]["origin"] == "Koramangala 5th Block"
    assert data["trip"]["destination"] == "Indiranagar 100ft Rd"
    assert data["trip"]["line_label"] == "Bus 201-G Rapid"


def test_risk_factors(client):
    res = client.get("/api/risk")
    assert res.status_code == 200
    data = res.json()
    assert "score" in data
    assert "band" in data
    assert "drivers" in data
    assert "factors" in data
    assert len(data["factors"]) > 0


def test_routes_endpoint(client):
    res = client.get("/api/routes")
    assert res.status_code == 200
    data = res.json()
    assert "options" in data
    assert len(data["options"]) >= 2
    assert "selected_route_id" in data


def test_route_selection_and_acceptance(client):
    res = client.post("/api/routes/select", json={"route_id": "b"})
    assert res.status_code == 200
    data = res.json()
    assert data.get("selected_route_id") == "b"

    accept_res = client.post("/api/routes/accept", json={"route_id": "b"})
    assert accept_res.status_code == 200
    accept_data = accept_res.json()
    assert "message" in accept_data


def test_guardians_crud(client):
    # Add guardian (valid 7-15 digit phone)
    payload = {
        "name": "Officer Miller",
        "relation": "Family",
        "phone": "5559012345",
    }
    add_res = client.post("/api/guardians", json=payload)
    assert add_res.status_code in (200, 201)
    added = add_res.json()
    assert added["name"] == "Officer Miller"
    g_id = added["id"]

    # Verify list
    list_res = client.get("/api/guardians")
    assert list_res.status_code == 200
    guardians = list_res.json()["guardians"]
    assert any(g["id"] == g_id for g in guardians)

    # Delete guardian
    del_res = client.delete(f"/api/guardians/{g_id}")
    assert del_res.status_code == 200


def test_havens_and_beacon(client):
    res = client.get("/api/havens")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "counts" in data
    assert len(data["items"]) > 0

    first_haven_id = data["items"][0]["id"]
    beacon_res = client.post(f"/api/havens/{first_haven_id}/beacon")
    assert beacon_res.status_code == 200
    assert "message" in beacon_res.json()


def test_privacy_and_purge(client):
    res = client.get("/api/privacy")
    assert res.status_code == 200
    data = res.json()
    assert "RAM" in data.get("storage")
    assert "policies" in data

    # Toggle policy
    toggle_res = client.put("/api/privacy/policies/anonymized_crowdsourcing", json={"enabled": False})
    assert toggle_res.status_code == 200
    assert toggle_res.json()["enabled"] is False

    # Purge
    purge_res = client.post("/api/privacy/purge")
    assert purge_res.status_code == 200
    assert purge_res.json().get("purged") is True


def test_stages_and_telemetry_simulation(client):
    # Reset demo to clean baseline
    client.post("/api/demo/reset")

    # Mock stage 3
    stage_res = client.post("/api/telemetry/mock", json={"stage": 3})
    assert stage_res.status_code == 200
    data = stage_res.json()
    assert data["journey"]["stage"] == 3
    assert data["risk_score"] == 67
    assert data["band"].lower() == "elevated"

    # Reset demo
    reset_res = client.post("/api/demo/reset")
    assert reset_res.status_code == 200


def test_sos_lifecycle(client):
    arm_res = client.post("/api/sos/arm")
    assert arm_res.status_code == 200
    status = arm_res.json()
    assert status["state"] in ("armed", "dispatched")

    cancel_res = client.post("/api/sos/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["state"] == "idle"


def test_live_route_sharing(client):
    share_res = client.post("/api/share/live-route")
    assert share_res.status_code == 200
    share_data = share_res.json()
    token = share_data["token"]
    passcode = share_data["passcode"]

    # View share with passcode
    view_res = client.get(f"/api/share/{token}", headers={"X-Passcode": passcode})
    assert view_res.status_code == 200
    view_data = view_res.json()
    assert "risk_score" in view_data
    assert "position" in view_data
