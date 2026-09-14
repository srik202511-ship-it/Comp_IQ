#!/usr/bin/env python3
"""
Backend API test for Saved Comparisons history feature.
Tests GET /api/analysis/history, POST /api/analysis/run snapshot append, POST /api/reset-demo.
"""
import requests
import time
import sys
from datetime import datetime, timezone

BASE_URL = "https://app-docs-10.preview.emergentagent.com/api"
DEMO_EMAIL = "demo@competeiq.ai"
DEMO_PASSWORD = "demo1234"

def log(msg):
    print(f"[TEST] {msg}")

def login():
    """Login as demo user and return token."""
    log(f"Logging in as {DEMO_EMAIL}...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    if resp.status_code != 200:
        log(f"❌ Login failed: {resp.status_code} {resp.text}")
        sys.exit(1)
    token = resp.json()["access_token"]
    log(f"✅ Login successful, token: {token[:20]}...")
    return token

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def test_1_initial_history(token):
    """TEST 1: GET /api/analysis/history should return 4 demo snapshots sorted ascending."""
    log("\n=== TEST 1: GET /api/analysis/history (initial 4 demo snapshots) ===")
    resp = requests.get(f"{BASE_URL}/analysis/history", headers=get_headers(token))
    if resp.status_code != 200:
        log(f"❌ GET /api/analysis/history failed: {resp.status_code} {resp.text}")
        return False, None
    
    snapshots = resp.json()
    log(f"✅ GET /api/analysis/history returned {len(snapshots)} snapshots")
    
    # Verify exactly 4 snapshots
    if len(snapshots) != 4:
        log(f"❌ Expected 4 snapshots, got {len(snapshots)}")
        return False, None
    log(f"✅ Exactly 4 snapshots returned")
    
    # Verify sorted ascending by generated_at
    dates = [s["generated_at"] for s in snapshots]
    sorted_dates = sorted(dates)
    if dates != sorted_dates:
        log(f"❌ Snapshots not sorted ascending by generated_at")
        log(f"   Got: {dates}")
        log(f"   Expected: {sorted_dates}")
        return False, None
    log(f"✅ Snapshots sorted ascending by generated_at")
    
    # Verify structure of each snapshot
    for i, snap in enumerate(snapshots):
        log(f"\n  Snapshot {i+1} (generated_at: {snap['generated_at']}):")
        
        # Check required fields
        required = ["id", "user_id", "generated_at", "mode", "our", "competitors"]
        missing = [f for f in required if f not in snap]
        if missing:
            log(f"    ❌ Missing fields: {missing}")
            return False, None
        log(f"    ✅ All required fields present")
        
        # Check 'our' structure
        our = snap["our"]
        if "name" not in our or "competitive_score" not in our:
            log(f"    ❌ 'our' missing name or competitive_score")
            return False, None
        log(f"    ✅ our.name: {our['name']}, our.competitive_score: {our['competitive_score']}")
        
        # Check competitors array
        competitors = snap["competitors"]
        if not isinstance(competitors, list):
            log(f"    ❌ 'competitors' is not an array")
            return False, None
        log(f"    ✅ competitors array has {len(competitors)} entries")
        
        # Verify each competitor has required fields
        for comp in competitors:
            required_comp = ["name", "comparability", "competitive_score", "is_comparable"]
            missing_comp = [f for f in required_comp if f not in comp]
            if missing_comp:
                log(f"    ❌ Competitor {comp.get('name', 'UNKNOWN')} missing fields: {missing_comp}")
                return False, None
        
        # Find HubSpot and verify it has null competitive_score and is_comparable=false
        hubspot = next((c for c in competitors if "HubSpot" in c["name"]), None)
        if hubspot:
            if hubspot["competitive_score"] is not None:
                log(f"    ❌ HubSpot competitive_score should be null, got {hubspot['competitive_score']}")
                return False, None
            if hubspot["is_comparable"] != False:
                log(f"    ❌ HubSpot is_comparable should be false, got {hubspot['is_comparable']}")
                return False, None
            log(f"    ✅ HubSpot: competitive_score=null, is_comparable=false")
        
        # Verify Datadog/Dynatrace/New Relic have numeric competitive_score
        for name in ["Datadog", "Dynatrace", "New Relic"]:
            comp = next((c for c in competitors if name in c["name"]), None)
            if comp:
                if not isinstance(comp["competitive_score"], (int, float)):
                    log(f"    ❌ {name} competitive_score should be numeric, got {comp['competitive_score']}")
                    return False, None
                log(f"    ✅ {name}: competitive_score={comp['competitive_score']} (numeric)")
    
    # Verify our.competitive_score RISES across the 4 snapshots
    log(f"\n  Verifying our.competitive_score RISES over time:")
    our_scores = [s["our"]["competitive_score"] for s in snapshots]
    log(f"    Scores: {our_scores}")
    
    for i in range(len(our_scores) - 1):
        if our_scores[i] >= our_scores[i+1]:
            log(f"    ❌ Score at index {i} ({our_scores[i]}) should be < score at index {i+1} ({our_scores[i+1]})")
            return False, None
    log(f"    ✅ our.competitive_score RISES across all 4 snapshots: {our_scores[0]} → {our_scores[-1]}")
    
    log(f"\n✅ TEST 1 PASSED: All 4 demo snapshots verified")
    return True, snapshots

def test_2_append_on_run(token):
    """TEST 2: POST /api/analysis/run should append a new snapshot (count increases by 1)."""
    log("\n=== TEST 2: POST /api/analysis/run (append new snapshot) ===")
    
    # Get initial history count
    resp = requests.get(f"{BASE_URL}/analysis/history", headers=get_headers(token))
    if resp.status_code != 200:
        log(f"❌ GET /api/analysis/history failed: {resp.status_code}")
        return False
    initial_count = len(resp.json())
    log(f"Initial history count: {initial_count}")
    
    # Get Datadog competitor ID
    resp = requests.get(f"{BASE_URL}/competitors", headers=get_headers(token))
    if resp.status_code != 200:
        log(f"❌ GET /api/competitors failed: {resp.status_code}")
        return False
    competitors = resp.json()
    datadog = next((c for c in competitors if "Datadog" in c.get("company_name", "")), None)
    if not datadog:
        log(f"❌ Datadog competitor not found")
        return False
    datadog_id = datadog["id"]
    log(f"✅ Found Datadog competitor ID: {datadog_id}")
    
    # Run analysis with Datadog
    log(f"Running POST /api/analysis/run with Datadog (may take up to 90s)...")
    start_time = time.time()
    resp = requests.post(
        f"{BASE_URL}/analysis/run",
        headers=get_headers(token),
        json={"competitor_ids": [datadog_id]},
        timeout=120
    )
    elapsed = time.time() - start_time
    log(f"Request completed in {elapsed:.1f}s")
    
    if resp.status_code == 502:
        log(f"⚠️  Got 502, retrying once...")
        time.sleep(2)
        start_time = time.time()
        resp = requests.post(
            f"{BASE_URL}/analysis/run",
            headers=get_headers(token),
            json={"competitor_ids": [datadog_id]},
            timeout=120
        )
        elapsed = time.time() - start_time
        log(f"Retry completed in {elapsed:.1f}s")
    
    if resp.status_code != 200:
        log(f"❌ POST /api/analysis/run failed: {resp.status_code} {resp.text[:500]}")
        return False
    
    report = resp.json()
    run_timestamp = report.get("generated_at")
    log(f"✅ POST /api/analysis/run succeeded, generated_at: {run_timestamp}")
    
    # Verify report contains Datadog
    competitors_in_report = report.get("competitors", [])
    datadog_in_report = next((c for c in competitors_in_report if "Datadog" in c.get("name", "")), None)
    if not datadog_in_report:
        log(f"❌ Datadog not found in report")
        return False
    log(f"✅ Report contains Datadog entry")
    
    # Get history again and verify count increased by 1
    resp = requests.get(f"{BASE_URL}/analysis/history", headers=get_headers(token))
    if resp.status_code != 200:
        log(f"❌ GET /api/analysis/history failed after run: {resp.status_code}")
        return False
    
    new_snapshots = resp.json()
    new_count = len(new_snapshots)
    log(f"New history count: {new_count}")
    
    if new_count != initial_count + 1:
        log(f"❌ Expected count to increase by 1 (from {initial_count} to {initial_count + 1}), got {new_count}")
        return False
    log(f"✅ History count increased by 1 (from {initial_count} to {new_count})")
    
    # Verify newest snapshot matches the run
    newest = new_snapshots[-1]  # Should be last since sorted ascending
    if newest["generated_at"] != run_timestamp:
        log(f"❌ Newest snapshot generated_at ({newest['generated_at']}) doesn't match run timestamp ({run_timestamp})")
        return False
    log(f"✅ Newest snapshot generated_at matches run timestamp")
    
    # Verify newest snapshot contains Datadog
    datadog_in_snap = next((c for c in newest["competitors"] if "Datadog" in c["name"]), None)
    if not datadog_in_snap:
        log(f"❌ Datadog not found in newest snapshot")
        return False
    log(f"✅ Newest snapshot contains Datadog entry")
    
    log(f"\n✅ TEST 2 PASSED: New snapshot appended successfully")
    return True

def test_3_reset_demo(token):
    """TEST 3: POST /api/reset-demo should clear history and reseed 4 demo snapshots."""
    log("\n=== TEST 3: POST /api/reset-demo (reset to 4 demo snapshots) ===")
    
    # Reset demo
    log(f"Calling POST /api/reset-demo...")
    resp = requests.post(f"{BASE_URL}/reset-demo", headers=get_headers(token))
    if resp.status_code != 200:
        log(f"❌ POST /api/reset-demo failed: {resp.status_code} {resp.text}")
        return False
    log(f"✅ POST /api/reset-demo succeeded")
    
    # Get history and verify it's back to 4 demo snapshots
    resp = requests.get(f"{BASE_URL}/analysis/history", headers=get_headers(token))
    if resp.status_code != 200:
        log(f"❌ GET /api/analysis/history failed after reset: {resp.status_code}")
        return False
    
    snapshots = resp.json()
    count = len(snapshots)
    log(f"History count after reset: {count}")
    
    if count != 4:
        log(f"❌ Expected 4 snapshots after reset, got {count}")
        return False
    log(f"✅ History reset to 4 demo snapshots")
    
    # Verify they are demo snapshots (check is_demo flag if present, or verify structure)
    # The demo snapshots should have the rising our.competitive_score pattern
    our_scores = [s["our"]["competitive_score"] for s in snapshots]
    log(f"our.competitive_score values: {our_scores}")
    
    for i in range(len(our_scores) - 1):
        if our_scores[i] >= our_scores[i+1]:
            log(f"❌ Score pattern doesn't match demo (should be rising)")
            return False
    log(f"✅ Demo snapshot pattern verified (rising scores)")
    
    log(f"\n✅ TEST 3 PASSED: Demo reset successful")
    return True

def test_4_regression(token):
    """TEST 4: Verify GET /api/analysis still works (regression test)."""
    log("\n=== TEST 4: GET /api/analysis (regression test) ===")
    
    resp = requests.get(f"{BASE_URL}/analysis", headers=get_headers(token))
    if resp.status_code != 200:
        log(f"❌ GET /api/analysis failed: {resp.status_code} {resp.text}")
        return False
    
    report = resp.json()
    
    # Verify basic structure
    required = ["our_product", "competitors", "matrix", "radar", "ranking", "insights"]
    missing = [f for f in required if f not in report]
    if missing:
        log(f"❌ Missing fields in report: {missing}")
        return False
    
    log(f"✅ GET /api/analysis returned valid report")
    log(f"   our_product: {report['our_product'].get('name')}")
    log(f"   competitors: {len(report['competitors'])} entries")
    log(f"   matrix: {len(report['matrix'])} entries")
    log(f"   ranking: {len(report['ranking'])} entries")
    
    log(f"\n✅ TEST 4 PASSED: GET /api/analysis regression test successful")
    return True

def main():
    log("Starting Saved Comparisons history feature tests...")
    log(f"Backend URL: {BASE_URL}")
    
    # Login
    token = login()
    
    # Run tests
    results = []
    
    # Test 1: Initial history
    success, snapshots = test_1_initial_history(token)
    results.append(("TEST 1: Initial history (4 demo snapshots)", success))
    if not success:
        log("\n❌ TEST 1 FAILED - stopping tests")
        sys.exit(1)
    
    # Test 2: Append on run
    success = test_2_append_on_run(token)
    results.append(("TEST 2: Append on run", success))
    if not success:
        log("\n❌ TEST 2 FAILED - continuing with remaining tests")
    
    # Test 3: Reset demo
    success = test_3_reset_demo(token)
    results.append(("TEST 3: Reset demo", success))
    if not success:
        log("\n❌ TEST 3 FAILED - continuing with remaining tests")
    
    # Test 4: Regression
    success = test_4_regression(token)
    results.append(("TEST 4: Regression", success))
    
    # Summary
    log("\n" + "="*80)
    log("TEST SUMMARY")
    log("="*80)
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        log(f"{status}: {test_name}")
    
    all_passed = all(success for _, success in results)
    if all_passed:
        log("\n🎉 ALL TESTS PASSED")
        sys.exit(0)
    else:
        log("\n❌ SOME TESTS FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()
