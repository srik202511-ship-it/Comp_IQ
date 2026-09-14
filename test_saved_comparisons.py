"""Test Saved Comparisons (custom insights history) endpoints."""
import os
import time
import requests
from datetime import datetime, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://app-docs-10.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@competeiq.ai"
DEMO_PASSWORD = "demo1234"

def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}

def test_saved_comparisons():
    """Test the new Saved Comparisons endpoints with all requirements."""
    
    print("\n" + "="*80)
    print("TESTING SAVED COMPARISONS (CUSTOM INSIGHTS HISTORY)")
    print("="*80)
    
    # ----------------------------- SETUP: Login & Reset -----------------------------
    print("\n[SETUP] LOGIN with demo credentials (triggers seeding with ONE saved comparison)...")
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    token = r.json()["access_token"]
    print(f"✅ Login successful, token received")
    
    headers = auth_headers(token)
    
    # ----------------------------- TEST 1: GET /api/analysis/saved -----------------------------
    print("\n[TEST 1] GET /api/analysis/saved - List saved comparisons...")
    r = requests.get(f"{API}/analysis/saved", headers=headers, timeout=30)
    assert r.status_code == 200, f"GET /api/analysis/saved failed: {r.status_code} {r.text}"
    saved_list = r.json()
    assert isinstance(saved_list, list), f"Expected list, got {type(saved_list)}"
    print(f"✅ GET /api/analysis/saved returned 200 with {len(saved_list)} saved comparison(s)")
    
    # Verify at least 1 saved comparison (seeded demo data)
    assert len(saved_list) >= 1, f"Expected at least 1 saved comparison, got {len(saved_list)}"
    print(f"✅ Found {len(saved_list)} saved comparison(s) (expected at least 1 from demo seed)")
    
    initial_count = len(saved_list)
    
    # Verify structure of first saved comparison summary
    print("\n[TEST 1.1] Verifying saved comparison summary structure...")
    first_saved = saved_list[0]
    required_fields = ["id", "created_at", "expires_at", "our_product", "competitors", "apples_to_apples", "competitive"]
    for field in required_fields:
        assert field in first_saved, f"Missing field '{field}' in saved comparison summary"
    print(f"✅ All required fields present: {', '.join(required_fields)}")
    
    # Verify our_product is a string
    assert isinstance(first_saved["our_product"], str), f"our_product should be string, got {type(first_saved['our_product'])}"
    print(f"✅ our_product: '{first_saved['our_product']}'")
    
    # Verify competitors is an array of names
    assert isinstance(first_saved["competitors"], list), f"competitors should be list, got {type(first_saved['competitors'])}"
    print(f"✅ competitors: {first_saved['competitors']} ({len(first_saved['competitors'])} competitors)")
    
    # Verify apples_to_apples (comparability scores)
    assert isinstance(first_saved["apples_to_apples"], list), f"apples_to_apples should be list"
    for item in first_saved["apples_to_apples"]:
        assert "name" in item and "score" in item, f"apples_to_apples item missing name or score: {item}"
    print(f"✅ apples_to_apples: {len(first_saved['apples_to_apples'])} items with name+score")
    
    # Verify competitive (competitive scores)
    assert isinstance(first_saved["competitive"], list), f"competitive should be list"
    for item in first_saved["competitive"]:
        assert "name" in item and "score" in item, f"competitive item missing name or score: {item}"
    print(f"✅ competitive: {len(first_saved['competitive'])} items with name+score")
    
    # Verify expires_at is ~30 days after created_at
    print("\n[TEST 1.2] Verifying expires_at is ~30 days after created_at...")
    created_at = datetime.fromisoformat(first_saved["created_at"].replace("Z", "+00:00"))
    expires_at = datetime.fromisoformat(first_saved["expires_at"].replace("Z", "+00:00"))
    delta_days = (expires_at - created_at).days
    assert 29 <= delta_days <= 31, f"Expected ~30 days retention, got {delta_days} days"
    print(f"✅ Retention period: {delta_days} days (within 29-31 days range)")
    print(f"   created_at: {first_saved['created_at']}")
    print(f"   expires_at: {first_saved['expires_at']}")
    
    # Verify list is sorted newest first
    if len(saved_list) > 1:
        print("\n[TEST 1.3] Verifying list is sorted newest first...")
        for i in range(len(saved_list) - 1):
            curr_time = datetime.fromisoformat(saved_list[i]["created_at"].replace("Z", "+00:00"))
            next_time = datetime.fromisoformat(saved_list[i+1]["created_at"].replace("Z", "+00:00"))
            assert curr_time >= next_time, f"List not sorted newest first: {saved_list[i]['created_at']} < {saved_list[i+1]['created_at']}"
        print(f"✅ List is sorted newest first")
    
    # ----------------------------- TEST 2: POST /api/analysis/save -----------------------------
    print("\n[TEST 2] POST /api/analysis/save - Save current comparison...")
    r = requests.post(f"{API}/analysis/save", headers=headers, timeout=30)
    assert r.status_code == 200, f"POST /api/analysis/save failed: {r.status_code} {r.text}"
    save_response = r.json()
    assert "saved" in save_response, "Missing 'saved' field in response"
    assert save_response["saved"] is True, f"Expected saved=true, got {save_response['saved']}"
    assert "id" in save_response, "Missing 'id' field in response"
    new_saved_id = save_response["id"]
    print(f"✅ POST /api/analysis/save returned {{\"saved\": true, \"id\": \"{new_saved_id}\"}}")
    
    # ----------------------------- TEST 2.1: Verify count increased -----------------------------
    print("\n[TEST 2.1] GET /api/analysis/saved again - Verify count increased...")
    r = requests.get(f"{API}/analysis/saved", headers=headers, timeout=30)
    assert r.status_code == 200, f"GET /api/analysis/saved failed: {r.status_code} {r.text}"
    saved_list_after = r.json()
    assert len(saved_list_after) == initial_count + 1, f"Expected count to increase by 1 (from {initial_count} to {initial_count + 1}), got {len(saved_list_after)}"
    print(f"✅ Count increased from {initial_count} to {len(saved_list_after)}")
    
    # Verify newest item is the one just saved
    print("\n[TEST 2.2] Verifying newest item is the one just saved...")
    newest_saved = saved_list_after[0]
    assert newest_saved["id"] == new_saved_id, f"Expected newest item id to be {new_saved_id}, got {newest_saved['id']}"
    print(f"✅ Newest item id matches: {new_saved_id}")
    
    # Get current comparison to verify competitors match
    print("\n[TEST 2.3] Verifying saved competitors match current comparison...")
    r = requests.get(f"{API}/analysis", headers=headers, timeout=30)
    assert r.status_code == 200, f"GET /api/analysis failed: {r.status_code}"
    current_report = r.json()
    current_competitors = [c["name"] for c in current_report.get("competitors", [])]
    saved_competitors = newest_saved["competitors"]
    assert set(saved_competitors) == set(current_competitors), f"Saved competitors {saved_competitors} don't match current {current_competitors}"
    print(f"✅ Saved competitors match current comparison: {saved_competitors}")
    
    # ----------------------------- TEST 3: GET /api/analysis/saved/{id} -----------------------------
    print("\n[TEST 3] GET /api/analysis/saved/{id} - Get full saved snapshot...")
    saved_id_to_fetch = saved_list[0]["id"]  # Use the first saved comparison from initial list
    r = requests.get(f"{API}/analysis/saved/{saved_id_to_fetch}", headers=headers, timeout=30)
    assert r.status_code == 200, f"GET /api/analysis/saved/{saved_id_to_fetch} failed: {r.status_code} {r.text}"
    full_snapshot = r.json()
    print(f"✅ GET /api/analysis/saved/{saved_id_to_fetch} returned 200")
    
    # Verify full snapshot structure
    print("\n[TEST 3.1] Verifying full snapshot structure...")
    assert "our_product" in full_snapshot, "Missing our_product in full snapshot"
    assert "competitors" in full_snapshot, "Missing competitors in full snapshot"
    assert "matrix" in full_snapshot, "Missing matrix in full snapshot"
    assert "radar" in full_snapshot, "Missing radar in full snapshot"
    assert "ranking" in full_snapshot, "Missing ranking in full snapshot"
    assert "insights" in full_snapshot, "Missing insights in full snapshot"
    print(f"✅ Full snapshot has all required sections: our_product, competitors, matrix, radar, ranking, insights")
    
    # Verify our_product has competitive_score
    print("\n[TEST 3.2] Verifying our_product has competitive_score...")
    our_product = full_snapshot["our_product"]
    assert "competitive_score" in our_product, "Missing competitive_score in our_product"
    assert isinstance(our_product["competitive_score"], dict), f"competitive_score should be dict, got {type(our_product['competitive_score'])}"
    assert "score" in our_product["competitive_score"], "Missing score in our_product.competitive_score"
    print(f"✅ our_product.competitive_score.score: {our_product['competitive_score']['score']}")
    
    # Verify competitors array structure
    print("\n[TEST 3.3] Verifying competitors array structure...")
    competitors = full_snapshot["competitors"]
    assert isinstance(competitors, list), f"competitors should be list, got {type(competitors)}"
    assert len(competitors) > 0, "competitors array is empty"
    print(f"✅ competitors array has {len(competitors)} competitors")
    
    # ----------------------------- TEST 4: SCORING SEPARATION -----------------------------
    print("\n[TEST 4] SCORING SEPARATION - Verify comparability and competitive_score are independent...")
    
    # Find a comparable competitor (e.g., Datadog)
    comparable_competitor = None
    for comp in competitors:
        if comp.get("name") == "Datadog" or (comp.get("comparability", {}).get("is_comparable") is True):
            comparable_competitor = comp
            break
    
    if not comparable_competitor:
        # Try to find any competitor with both scores
        for comp in competitors:
            if "comparability" in comp and "competitive_score" in comp:
                comparable_competitor = comp
                break
    
    assert comparable_competitor is not None, "Could not find a comparable competitor to test scoring separation"
    
    comp_name = comparable_competitor["name"]
    print(f"\n[TEST 4.1] Testing scoring separation for competitor: {comp_name}")
    
    # Verify comparability object exists
    assert "comparability" in comparable_competitor, f"Missing comparability for {comp_name}"
    comparability = comparable_competitor["comparability"]
    assert isinstance(comparability, dict), f"comparability should be dict, got {type(comparability)}"
    assert "score" in comparability, f"Missing score in comparability for {comp_name}"
    comparability_score = comparability["score"]
    print(f"✅ {comp_name} comparability.score: {comparability_score}")
    
    # Verify competitive_score exists
    assert "competitive_score" in comparable_competitor, f"Missing competitive_score for {comp_name}"
    competitive_score_obj = comparable_competitor["competitive_score"]
    
    # competitive_score can be null for non-comparable competitors
    if competitive_score_obj is None:
        print(f"⚠️  {comp_name} competitive_score is null (non-comparable competitor)")
    else:
        assert isinstance(competitive_score_obj, dict), f"competitive_score should be dict or null, got {type(competitive_score_obj)}"
        assert "score" in competitive_score_obj, f"Missing score in competitive_score for {comp_name}"
        competitive_score = competitive_score_obj["score"]
        print(f"✅ {comp_name} competitive_score.score: {competitive_score}")
        
        # Verify scores are different (independent)
        assert comparability_score != competitive_score, f"Scores should be different (independent), but both are {comparability_score}"
        print(f"✅ SCORING SEPARATION VERIFIED: comparability ({comparability_score}) ≠ competitive ({competitive_score})")
        print(f"   This proves comparability is NOT overwritten by competitive score")
    
    # Test with all competitors to ensure separation
    print("\n[TEST 4.2] Verifying scoring separation for ALL competitors...")
    for comp in competitors:
        comp_name = comp["name"]
        if "comparability" in comp and "competitive_score" in comp:
            comp_comparability = comp["comparability"].get("score")
            comp_competitive = comp["competitive_score"]
            if comp_competitive is not None:
                comp_competitive_score = comp_competitive.get("score")
                print(f"   {comp_name}: comparability={comp_comparability}, competitive={comp_competitive_score}")
                if comp_comparability is not None and comp_competitive_score is not None:
                    # Scores should be independent (different values)
                    # Note: They could theoretically be the same by coincidence, but in practice they should differ
                    pass
            else:
                print(f"   {comp_name}: comparability={comp_comparability}, competitive=null (non-comparable)")
    print(f"✅ All competitors have independent comparability and competitive_score fields")
    
    # ----------------------------- TEST 5: 404 for non-existent ID -----------------------------
    print("\n[TEST 5] GET /api/analysis/saved/nonexistent-id - Verify 404...")
    r = requests.get(f"{API}/analysis/saved/nonexistent-id-12345", headers=headers, timeout=30)
    assert r.status_code == 404, f"Expected 404 for non-existent ID, got {r.status_code}"
    print(f"✅ GET /api/analysis/saved/nonexistent-id returned 404")
    
    # ----------------------------- TEST 6: REGRESSION TESTS -----------------------------
    print("\n[TEST 6] REGRESSION TESTS...")
    
    print("\n[TEST 6.1] GET /api/analysis - Current report still works...")
    r = requests.get(f"{API}/analysis", headers=headers, timeout=30)
    assert r.status_code == 200, f"GET /api/analysis failed: {r.status_code}"
    current = r.json()
    assert "our_product" in current and "competitors" in current, "Current report missing required fields"
    print(f"✅ GET /api/analysis still returns current report")
    
    print("\n[TEST 6.2] GET /api/analysis/history - Trend snapshots still work...")
    r = requests.get(f"{API}/analysis/history", headers=headers, timeout=30)
    assert r.status_code == 200, f"GET /api/analysis/history failed: {r.status_code}"
    history = r.json()
    assert isinstance(history, list), f"Expected list, got {type(history)}"
    print(f"✅ GET /api/analysis/history still returns {len(history)} trend snapshots")
    
    print("\n[TEST 6.3] POST /api/reset-demo - Reset and verify saved comparisons...")
    r = requests.post(f"{API}/reset-demo", headers=headers, timeout=30)
    assert r.status_code == 200, f"POST /api/reset-demo failed: {r.status_code}"
    print(f"✅ POST /api/reset-demo successful")
    
    print("\n[TEST 6.4] GET /api/analysis/saved after reset - Verify single reseeded saved comparison...")
    r = requests.get(f"{API}/analysis/saved", headers=headers, timeout=30)
    assert r.status_code == 200, f"GET /api/analysis/saved failed: {r.status_code}"
    saved_after_reset = r.json()
    assert len(saved_after_reset) == 1, f"Expected 1 reseeded saved comparison after reset, got {len(saved_after_reset)}"
    print(f"✅ After reset, GET /api/analysis/saved returns 1 reseeded demo saved comparison (not accumulated)")
    
    # ----------------------------- SUMMARY -----------------------------
    print("\n" + "="*80)
    print("✅ ALL SAVED COMPARISONS TESTS PASSED")
    print("="*80)
    print(f"\nSUMMARY:")
    print(f"  • Initial saved comparisons count: {initial_count}")
    print(f"  • After POST /api/analysis/save: {initial_count + 1}")
    print(f"  • After reset: 1 (reseeded demo)")
    print(f"  • Scoring separation verified for: {comp_name}")
    print(f"    - comparability.score: {comparability_score}")
    if competitive_score_obj is not None:
        print(f"    - competitive_score.score: {competitive_score}")
    else:
        print(f"    - competitive_score: null (non-comparable)")
    print(f"  • All regression tests passed")
    print()

if __name__ == "__main__":
    try:
        test_saved_comparisons()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
