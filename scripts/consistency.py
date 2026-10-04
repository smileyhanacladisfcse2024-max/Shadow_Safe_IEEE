#!/usr/bin/env python3
"""Cross-Screen Consistency Audit Script for ShadowSafe 2.0.

Verifies that for each simulated stage (1..5):
1. Score & Risk Band match exactly between /journey and /risk.
2. Trip ID & Session ID match between /journey, /guardians, and /privacy.
3. Guardian counts and names match between /journey and /guardians.
4. Nearest haven in /risk matches the nearest item in /havens.
5. Exact expected benchmark scores are verified (Stage 1: 12, Stage 2: 38, Stage 3: 67, Stage 4: 89, Stage 5: 14).
"""
import sys
from pathlib import Path

# Force UTF-8 on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app

STAGE_EXPECTATIONS = {
    1: {"score": 12, "band": "safe"},
    2: {"score": 38, "band": "moderate"},
    3: {"score": 67, "band": "elevated"},
    4: {"score": 89, "band": "critical"},
    5: {"score": 14, "band": "safe"},
}


def run_audit():
    print("=" * 70)
    print(" SHADOWSAFE 2.0 - CROSS-SCREEN DATA CONSISTENCY AUDIT")
    print("=" * 70)

    client = TestClient(app)
    total_checks = 0
    passed_checks = 0

    with client:
        # Reset demo to baseline
        client.post("/api/demo/reset")

        for stage, exp in STAGE_EXPECTATIONS.items():
            print(f"\n[+] Auditing Stage {stage}...")

            # Set stage
            mock_res = client.post("/api/telemetry/mock", json={"stage": stage})
            assert mock_res.status_code == 200, f"Failed to mock stage {stage}"

            # Query all endpoints
            journey_data = client.get("/api/journey").json()
            risk_data = client.get("/api/risk").json()
            guardians_data = client.get("/api/guardians").json()
            havens_data = client.get("/api/havens").json()
            privacy_data = client.get("/api/privacy").json()

            # 1. Score verification
            total_checks += 1
            j_score = journey_data["risk"]["score"]
            r_score = risk_data["score"]
            if j_score == exp["score"] and r_score == exp["score"]:
                print(f"    ✓ Expected Score {exp['score']} matches: journey={j_score}, risk={r_score}")
                passed_checks += 1
            else:
                print(f"    ✗ Score mismatch: expected {exp['score']}, got journey={j_score}, risk={r_score}")

            # 2. Risk band verification
            total_checks += 1
            j_band = journey_data["risk"]["band"].lower()
            r_band = risk_data["band"].lower()
            if j_band == exp["band"] and r_band == exp["band"]:
                print(f"    ✓ Risk Band '{exp['band']}' synchronized: journey={j_band}, risk={r_band}")
                passed_checks += 1
            else:
                print(f"    ✗ Band mismatch: expected {exp['band']}, got journey={j_band}, risk={r_band}")

            # 3. Trip ID & Session ID synchronization
            total_checks += 1
            trip_id_j = journey_data["trip_id"]
            trip_id_g = guardians_data["trip_id"]
            session_id_j = journey_data["session_id"]
            session_id_p = privacy_data["session_id"]
            if trip_id_j == trip_id_g and session_id_j == session_id_p:
                print(f"    ✓ State IDs synchronized (Trip #{trip_id_j}, Session {session_id_j[:8]}...)")
                passed_checks += 1
            else:
                print(f"    ✗ ID mismatch: Trip j={trip_id_j}/g={trip_id_g}, Session j={session_id_j}/p={session_id_p}")

            # 4. Guardian count & names
            total_checks += 1
            j_g_count = journey_data["guardians"]["connected"]
            g_active_count = guardians_data["active_count"]
            j_names = set(journey_data["guardians"]["names"])
            personal_names = {g["name"] for g in guardians_data["guardians"] if g["kind"] == "personal"}
            if j_g_count == g_active_count and j_names == personal_names:
                print(f"    ✓ Guardians synchronized: {j_g_count} active contacts ({', '.join(sorted(j_names))})")
                passed_checks += 1
            else:
                print(f"    ✗ Guardian mismatch: count j={j_g_count}/g={g_active_count}, names {j_names} vs {personal_names}")

            # 5. Haven proximity consistency
            total_checks += 1
            nearest_in_risk = risk_data["nearest_haven"]
            nearest_in_havens = havens_data["items"][0] if havens_data.get("items") else None
            if nearest_in_risk and nearest_in_havens and nearest_in_risk["id"] == nearest_in_havens["id"]:
                print(f"    ✓ Nearest Haven synchronized: '{nearest_in_risk['name']}' ({nearest_in_risk['distance_m']}m)")
                passed_checks += 1
            else:
                print(f"    ✗ Haven mismatch: risk={nearest_in_risk}, havens={nearest_in_havens}")

    print("\n" + "=" * 70)
    print(f" AUDIT COMPLETE: {passed_checks}/{total_checks} consistency checks passed.")
    print("=" * 70)

    if passed_checks == total_checks:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    run_audit()
